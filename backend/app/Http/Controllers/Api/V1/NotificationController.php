<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List paginated notifications for the authenticated user (newest first).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 50));

        $paginator = Notification::where('user_id', $user->id)
            ->latest()
            ->paginate($perPage);

        $transformed = $paginator->getCollection()->map(fn (Notification $n) => $this->transformNotification($n));

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
     * Get accurate unread count for the authenticated user.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $count = Notification::where('user_id', $user->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    /**
     * Mark a single notification as read (with strict ownership check).
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Notification $notification */
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->update(['read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * Mark all unread notifications as read for the authenticated user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * Transform a Notification model to match frontend NotificationItem.
     *
     * @return array<string, mixed>
     */
    private function transformNotification(Notification $n): array
    {
        return [
            'id' => (string) $n->id,
            'userId' => (string) $n->user_id,
            'role' => $n->role,
            'type' => (string) $n->type,
            'title' => (string) $n->title,
            'titleBn' => (string) $n->title_bn,
            'message' => (string) $n->message,
            'messageBn' => (string) $n->message_bn,
            'read' => (bool) $n->read,
            'link' => $n->link,
            'createdAt' => $n->created_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}

