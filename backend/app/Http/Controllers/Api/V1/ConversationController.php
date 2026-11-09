<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Models\ContactRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ConversationController extends Controller
{
    /**
     * List all conversations for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 50));

        $paginator = Conversation::where('tenant_id', $user->id)
            ->orWhere('landlord_id', $user->id)
            ->with(['property', 'tenant', 'landlord', 'messages.sender'])
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        $transformed = $paginator->getCollection()->map(fn (Conversation $conv) => $this->transformConversation($conv));

        return response()->json([
            'data' => $transformed,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Retrieve single conversation and its messages.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Conversation $conversation */
        $conversation = Conversation::with(['property', 'tenant', 'landlord', 'messages.sender'])
            ->findOrFail($id);

        if (! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'status' => 403,
                'message' => 'common.errors.forbidden',
            ], 403);
        }

        // Mark incoming unread messages as read for authenticated participant
        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => $this->transformConversation($conversation->fresh(['property', 'tenant', 'landlord', 'messages.sender'])),
        ]);
    }

    /**
     * Send a subsequent message in an existing conversation.
     */
    public function sendMessage(SendMessageRequest $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $text = trim((string) $request->input('text'));

        /** @var Conversation $conversation */
        $conversation = Conversation::with(['property', 'tenant', 'landlord'])->findOrFail($id);

        if (! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'status' => 403,
                'message' => 'common.errors.forbidden',
            ], 403);
        }

        $message = DB::transaction(function () use ($conversation, $user, $text) {
            /** @var Conversation $lockedConv */
            $lockedConv = Conversation::where('id', $conversation->id)->lockForUpdate()->firstOrFail();

            /** @var Message $createdMessage */
            $createdMessage = Message::create([
                'conversation_id' => $lockedConv->id,
                'sender_id' => $user->id,
                'text' => $text,
            ]);

            $lockedConv->update([
                'last_message' => $text,
                'last_message_at' => now(),
            ]);

            $recipientId = (int) $lockedConv->tenant_id === (int) $user->id
                ? $lockedConv->landlord_id
                : $lockedConv->tenant_id;

            $recipientRole = (int) $user->id === (int) $lockedConv->tenant_id
                ? 'landlord'
                : 'tenant';

            $targetLink = $recipientRole === 'landlord'
                ? '/landlord/messages'
                : '/tenant/messages';

            Notification::create([
                'user_id' => $recipientId,
                'role' => $recipientRole,
                'type' => 'contact',
                'title' => 'New Message',
                'title_bn' => 'নতুন বার্তা',
                'message' => "{$user->name}: " . Str::limit($text, 60),
                'message_bn' => "{$user->name}: " . Str::limit($text, 60),
                'link' => $targetLink,
                'read' => false,
            ]);

            return $createdMessage;
        });

        $message->load('sender');

        return response()->json([
            'success' => true,
            'data' => $this->transformMessage($message),
            'message' => 'Message sent successfully.',
        ], 201);
    }

    /**
     * Start a conversation lazily from an accepted contact request.
     */
    public function startFromContactRequest(SendMessageRequest $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $text = trim((string) $request->input('text'));

        /** @var ContactRequest $contactRequest */
        $contactRequest = ContactRequest::with(['property', 'tenant', 'landlord'])->findOrFail($id);

        if (strtolower($contactRequest->status) !== 'accepted') {
            return response()->json([
                'status' => 422,
                'message' => 'Messaging is only available for accepted contact requests.',
            ], 422);
        }

        $userId = (int) $user->id;
        if ($userId !== (int) $contactRequest->tenant_id && $userId !== (int) $contactRequest->landlord_id) {
            return response()->json([
                'status' => 403,
                'message' => 'common.errors.forbidden',
            ], 403);
        }

        $result = DB::transaction(function () use ($contactRequest, $user, $text, $userId) {
            // Lock parent user to serialize concurrent first-message creation
            User::where('id', $userId)->lockForUpdate()->first();

            /** @var Conversation $conversation */
            $conversation = Conversation::firstOrCreate(
                [
                    'property_id' => $contactRequest->property_id,
                    'tenant_id' => $contactRequest->tenant_id,
                ],
                [
                    'landlord_id' => $contactRequest->landlord_id,
                ]
            );

            /** @var Message $createdMessage */
            $createdMessage = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'text' => $text,
            ]);

            $conversation->update([
                'last_message' => $text,
                'last_message_at' => now(),
            ]);

            $recipientId = (int) $conversation->tenant_id === $userId
                ? $conversation->landlord_id
                : $conversation->tenant_id;

            $recipientRole = (int) $conversation->tenant_id === $userId
                ? 'landlord'
                : 'tenant';

            $targetLink = $recipientRole === 'landlord'
                ? '/landlord/messages'
                : '/tenant/messages';

            Notification::create([
                'user_id' => $recipientId,
                'role' => $recipientRole,
                'type' => 'contact',
                'title' => 'New Message',
                'title_bn' => 'নতুন বার্তা',
                'message' => "{$user->name}: " . Str::limit($text, 60),
                'message_bn' => "{$user->name}: " . Str::limit($text, 60),
                'link' => $targetLink,
                'read' => false,
            ]);

            return [
                'message' => $createdMessage,
                'conversation' => $conversation,
            ];
        });

        /** @var Message $message */
        $message = $result['message'];
        $message->load('sender');

        /** @var Conversation $conversation */
        $conversation = $result['conversation'];
        $conversation->load(['property', 'tenant', 'landlord', 'messages.sender']);

        return response()->json([
            'success' => true,
            'data' => $this->transformMessage($message),
            'conversation' => $this->transformConversation($conversation),
            'message' => 'Conversation started and message sent successfully.',
        ], 201);
    }

    /**
     * Transform a Conversation model to match frontend ConversationItem.
     *
     * @return array<string, mixed>
     */
    private function transformConversation(Conversation $conv): array
    {
        $messages = $conv->messages
            ->sortBy('created_at')
            ->values()
            ->map(fn (Message $m) => $this->transformMessage($m))
            ->all();

        return [
            'id' => (string) $conv->id,
            'propertyId' => (string) $conv->property_id,
            'propertyTitle' => $conv->property ? (string) $conv->property->title : 'Listing #' . $conv->property_id,
            'landlordId' => (string) $conv->landlord_id,
            'landlordName' => $conv->landlord ? (string) $conv->landlord->name : 'Landlord',
            'tenantId' => (string) $conv->tenant_id,
            'tenantName' => $conv->tenant ? (string) $conv->tenant->name : 'Tenant',
            'lastMessage' => (string) ($conv->last_message ?? ''),
            'lastMessageAt' => $conv->last_message_at?->toISOString() ?? $conv->updated_at?->toISOString() ?? now()->toISOString(),
            'messages' => $messages,
        ];
    }

    /**
     * Transform a Message model to match frontend MessageItem.
     *
     * @return array<string, mixed>
     */
    private function transformMessage(Message $m): array
    {
        /** @var User|null $sender */
        $sender = $m->sender;
        $senderRole = 'tenant';
        if ($sender && $sender->relationLoaded('role') && $sender->role) {
            $senderRole = (string) $sender->role->slug;
        }

        return [
            'id' => (string) $m->id,
            'conversationId' => (string) $m->conversation_id,
            'senderId' => (string) $m->sender_id,
            'senderName' => $sender ? (string) $sender->name : 'User',
            'senderRole' => $senderRole,
            'text' => (string) $m->text,
            'createdAt' => $m->created_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}

