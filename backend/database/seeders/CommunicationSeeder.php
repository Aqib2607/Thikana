<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Property;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CommunicationSeeder extends Seeder
{
    /**
     * Seed chat conversations, messages, and in-app bilingual notifications.
     */
    public function run(): void
    {
        $tenants = User::where('email', 'like', 'tenant%@demo.test')->orderBy('id')->get();
        $landlords = User::where('email', 'like', 'landlord%@demo.test')->orderBy('id')->get();
        $approvedProperties = Property::where('approval_status', 'Approved')->orderBy('id')->get();

        if ($tenants->isEmpty() || $landlords->isEmpty() || $approvedProperties->isEmpty()) {
            return;
        }

        $baseDate = Carbon::create(2026, 11, 1, 12, 0, 0);

        // 1. Seed 10 Real Conversations with 4 to 6 Messages Each
        $conversationTemplates = $this->getConversationTemplates();

        foreach ($conversationTemplates as $cIndex => $template) {
            $prop = $approvedProperties[$template['property_index'] % $approvedProperties->count()];
            $tenant = $tenants[$template['tenant_index'] % $tenants->count()];
            $landlord = $prop->landlord;

            if (! $landlord instanceof User) {
                continue;
            }

            /** @var Conversation $conversation */
            $conversation = Conversation::firstOrCreate(
                [
                    'property_id' => $prop->id,
                    'tenant_id' => $tenant->id,
                ],
                [
                    'landlord_id' => $landlord->id,
                    'last_message' => end($template['messages'])['text'],
                    'last_message_at' => $baseDate->copy()->subHours(10 - $cIndex),
                ]
            );

            foreach ($template['messages'] as $mIndex => $msg) {
                $sender = $msg['is_tenant'] ? $tenant : $landlord;
                $msgTime = $baseDate->copy()->subHours((10 - $cIndex) * 2)->addMinutes($mIndex * 15);

                Message::firstOrCreate(
                    [
                        'conversation_id' => $conversation->id,
                        'sender_id' => $sender->id,
                        'text' => $msg['text'],
                    ],
                    [
                        'read_at' => $msg['is_read'] ? $msgTime->copy()->addMinutes(5) : null,
                        'created_at' => $msgTime,
                    ]
                );
            }
        }

        // 2. Seed 35 In-App Bilingual Notifications
        $notificationsData = $this->getNotificationsData();

        foreach ($notificationsData as $nIndex => $notif) {
            $recipient = ($notif['target'] === 'landlord')
                ? $landlords[$notif['user_index'] % $landlords->count()]
                : $tenants[$notif['user_index'] % $tenants->count()];

            Notification::updateOrCreate(
                [
                    'user_id' => $recipient->id,
                    'title' => $notif['title'],
                ],
                [
                    'role' => $notif['target'],
                    'type' => $notif['type'],
                    'title_bn' => $notif['title_bn'],
                    'message' => $notif['message'],
                    'message_bn' => $notif['message_bn'],
                    'link' => $notif['link'],
                    'read' => $notif['read'],
                    'created_at' => $baseDate->copy()->subDays(15 - ($nIndex % 15)),
                ]
            );
        }
    }

    /**
     * 10 conversation dialog templates.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getConversationTemplates(): array
    {
        return [
            // Conversation 1 - Sonadanga Flat Inquiry
            [
                'property_index' => 0,
                'tenant_index' => 0,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'আসসালামু আলাইকুম। ফ্ল্যাটটি কি এখনো অ্যাভেইলেবল আছে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'ওয়ালাইকুম আসসালাম। হ্যাঁ, ফ্ল্যাটটি খালি আছে। আপনি কবে থেকে উঠতে চাচ্ছেন?', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'আমরা আগামী মাসের ১ তারিখ থেকে উঠতে চাই। ফ্যামিলিতে আমরা মোট ৩ জন।', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'আলহামদুলিল্লাহ। ছোট ফ্যামিলির জন্য এটি উপযুক্ত। শুক্রবার বিকেলে এসে দেখে যেতে পারেন।', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'ধন্যবাদ ভাই, আমি ইনশাআল্লাহ শুক্রবার বিকেল ৪টায় আসব।', 'is_read' => true],
                ],
            ],
            // Conversation 2 - Boyra Medical Room Inquiry
            [
                'property_index' => 1,
                'tenant_index' => 1,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'Hello! Is this room still vacant for medical interns?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'Hello. Yes, it is vacant. We have 2 other doctors living on the same floor.', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'That sounds great! Does the rent include high-speed WiFi and water?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'Yes, high-speed WiFi, deep tube-well water, and waste collection are fully included.', 'is_read' => true],
                ],
            ],
            // Conversation 3 - Mujgunni 2BHK Discussion
            [
                'property_index' => 2,
                'tenant_index' => 2,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'মুজগুন্নির ফ্ল্যাটে কি গ্যাস সিলিন্ডার ব্যবহার করতে হবে নাকি পাইপলাইন আছে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'এখানে এলপিজি সিলিন্ডার ব্যবহার করতে হয়। সিলিন্ডার রাখার নিরাপদ ব্যবস্থা কিচেন ব্যালকনিতে রয়েছে।', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'এডভান্স কত মাসের দিতে হবে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => '২ মাসের এডভান্স দিতে হবে। চুক্তিপত্র করার সময় এক মাসের এবং ওঠার সময় বাকিটা।', 'is_read' => false],
                ],
            ],
            // Conversation 4 - Nirala Executive Flat Visit Confirmation
            [
                'property_index' => 3,
                'tenant_index' => 3,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'We submitted a visit request for Nirala Prime Tower on Saturday.', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'Yes, I received the request and accepted it. Gate security has been notified.', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'Is covered parking available for an SUV?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'Yes, Slot G-4 is reserved for this apartment and can comfortably accommodate an SUV.', 'is_read' => true],
                ],
            ],
            // Conversation 5 - Khalishpur Bachelor Flat Inquiry
            [
                'property_index' => 4,
                'tenant_index' => 4,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'আমরা দুজন বন্ধু চাকরিজীবী। ফ্ল্যাটটি কি ব্যাচেলরদের দেওয়া হবে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'আইডি কার্ড ও অফিসের প্রত্যয়নপত্র থাকলে কোনো আপত্তি নেই।', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'আমাদের কাছে অফিস আইডি আছে। আমরা কি কাল সন্ধ্যায় আসতে পারি?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'হ্যাঁ, সন্ধ্যা ৭টায় আসুন। আমি নিচতলায় থাকব।', 'is_read' => true],
                ],
            ],
            // Conversation 6 - Gollamari Student Mess Inquiry
            [
                'property_index' => 5,
                'tenant_index' => 5,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'মেসে মিল সিস্টেমের মাসিক খরচ আনুমানিক কত আসে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'মাসে গড়ে ২৫০০ থেকে ২৮০০ টাকার মত মিল খরচ হয়। খালার বেতন মেসে ভাগ করে দেওয়া হয়।', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'রুমে পড়ার টেবিল আর ফ্যান আছে কি?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'হ্যাঁ, প্রতিটি সিটের সাথে পড়ার টেবিল, চেয়ার ও সিলিং ফ্যান রয়েছে।', 'is_read' => true],
                ],
            ],
            // Conversation 7 - Shibbari Luxury Flat Details
            [
                'property_index' => 6,
                'tenant_index' => 6,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'শিববাড়ির ৭ম তলার ফ্ল্যাটটির ব্যালকনি কোন দিকে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'দক্ষিণ-পশ্চিম মুখী। প্রচুর বাতাস ও সূর্যের আলো পাওয়া যায়।', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'জেনারেটরে কি এসি চলবে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'জেনারেটরে লাইট, ফ্যান ও ফ্রিজ চলবে। এসির জন্য ডেডিকেটেড মিটার আছে যা মেইন লাইনে চলে।', 'is_read' => true],
                ],
            ],
            // Conversation 8 - KDA Avenue Duplex Penthouse
            [
                'property_index' => 7,
                'tenant_index' => 7,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'Is the rooftop garden private or shared with the building?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'The upper terrace of the duplex is 100% private and accessible only from inside your penthouse.', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'Excellent. We would like to finalize the lease agreement next week.', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'Great. I will have the draft agreement ready with our legal counsel.', 'is_read' => false],
                ],
            ],
            // Conversation 9 - Daulatpur BL College Flat
            [
                'property_index' => 8,
                'tenant_index' => 8,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'দৌলতপুর কলেজের ছাত্ররা কি এখানে থাকতে পারবে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'হ্যাঁ, শান্তশিষ্ট ছাত্রদের অগ্রাধিকার দেওয়া হয়।', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'আমরা দুজন অনার্সের ছাত্র। আগামী সপ্তাহে দেখা করতে চাই।', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'যোগাযোগ করে চলে আসুন।', 'is_read' => true],
                ],
            ],
            // Conversation 10 - Choto Boyra Family Home
            [
                'property_index' => 9,
                'tenant_index' => 9,
                'messages' => [
                    ['is_tenant' => true, 'text' => 'ছোট বয়রার বাসাটিতে কি আলাদা বিদ্যুৎ মিটার আছে?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'হ্যাঁ, প্রিপেইড আলাদা ডিজিটাল মিটার রয়েছে। ব্যবহার অনুযায়ী কার্ড রিচার্জ করবেন।', 'is_read' => true],
                    ['is_tenant' => true, 'text' => 'বিল্ডিংয়ের সিকিউরিটি কেমন?', 'is_read' => true],
                    ['is_tenant' => false, 'text' => 'সিসিটিভি ক্যামেরা আছে এবং রাত ১১টায় মেইন গেট বন্ধ করা হয়।', 'is_read' => false],
                ],
            ],
        ];
    }

    /**
     * Exactly 35 realistic bilingual notification templates.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getNotificationsData(): array
    {
        return [
            // Landlord notifications (13)
            ['target' => 'landlord', 'user_index' => 0, 'type' => 'visit_request', 'title' => 'New Visit Request Received', 'title_bn' => 'নতুন ভিজিট অনুরোধ এসেছে', 'message' => 'Rafi Ahmed requested a morning visit for Green Villa 3A.', 'message_bn' => 'রাফি আহমেদ গ্রীন ভিলা ৩এ-এর জন্য সকালের ভিজিটের অনুরোধ করেছেন।', 'link' => '/landlord/visits', 'read' => false],
            ['target' => 'landlord', 'user_index' => 0, 'type' => 'contact_request', 'title' => 'New Inquiry on Your Property', 'title_bn' => 'আপনার সম্পত্তিতে নতুন বার্তা', 'message' => 'A tenant sent an inquiry about car parking availability.', 'message_bn' => 'একজন ভাড়াটিয়া পার্কিং সুবিধার বিষয়ে জানতে চেয়েছেন।', 'link' => '/landlord/contact-requests', 'read' => true],
            ['target' => 'landlord', 'user_index' => 0, 'type' => 'property_approved', 'title' => 'Property Listing Approved', 'title_bn' => 'বিজ্ঞাপন অনুমোদিত হয়েছে', 'message' => 'Your listing "Green Villa Luxury 3BHK" has been approved by admin.', 'message_bn' => 'আপনার বিজ্ঞাপন "গ্রীন ভিলা বিলাসবহুল ৩ রুমের ফ্ল্যাট" অ্যাডমিন কর্তৃক অনুমোদিত হয়েছে।', 'link' => '/properties/sonadanga-green-villa-3a', 'read' => true],
            ['target' => 'landlord', 'user_index' => 1, 'type' => 'visit_request', 'title' => 'Visit Confirmed by Tenant', 'title_bn' => 'ভাড়াটিয়া ভিজিট নিশ্চিত করেছেন', 'message' => 'Medical student confirmed visit on Friday evening.', 'message_bn' => 'মেডিকেল ছাত্র শুক্রবার সন্ধ্যার ভিজিট নিশ্চিত করেছেন।', 'link' => '/landlord/visits', 'read' => false],
            ['target' => 'landlord', 'user_index' => 1, 'type' => 'review_received', 'title' => 'New 5-Star Review Received', 'title_bn' => 'নতুন ৫-তারকা রিভিউ এসেছে', 'message' => 'Your Boyra medical room received an excellent 5-star review.', 'message_bn' => 'আপনার বয়রা মেডিকেল রুমটি একটি ৫-তারকা রিভিউ পেয়েছে।', 'link' => '/properties/boyra-medical-square-sublet-room', 'read' => true],
            ['target' => 'landlord', 'user_index' => 2, 'type' => 'contact_request', 'title' => 'New Inquiry on Mujgunni Flat', 'title_bn' => 'মুজগুন্নি ফ্ল্যাটে নতুন অনুসন্ধান', 'message' => 'Inquiry received regarding advance payment options.', 'message_bn' => 'অগ্রিম পেমেন্ট বিষয়ে অনুসন্ধান এসেছে।', 'link' => '/landlord/contact-requests', 'read' => false],
            ['target' => 'landlord', 'user_index' => 3, 'type' => 'visit_request', 'title' => 'Visit Request for Nirala Tower', 'title_bn' => 'নিরালা টাওয়ারে ভিজিট অনুরোধ', 'message' => 'Corporate family requested Saturday inspection.', 'message_bn' => 'কর্পোরেট পরিবার শনিবার ভিজিটের অনুরোধ জানিয়েছেন।', 'link' => '/landlord/visits', 'read' => true],
            ['target' => 'landlord', 'user_index' => 3, 'type' => 'property_verified', 'title' => 'Verification Badge Awarded', 'title_bn' => 'যাচাইকরণ ব্যাজ অর্জিত হয়েছে', 'message' => 'Nirala Prime Tower has been physically inspected and verified.', 'message_bn' => 'নিরালা প্রাইম টাওয়ার সরেজমিনে পরিদর্শনপূর্বক যাচাই সম্পন্ন হয়েছে।', 'link' => '/properties/nirala-prime-tower-executive-flat', 'read' => true],
            ['target' => 'landlord', 'user_index' => 4, 'type' => 'contact_request', 'title' => 'Bachelor Inquiry for Khalishpur', 'title_bn' => 'খালিশপুরে ব্যাচেলর অনুসন্ধান', 'message' => 'Two professionals inquired about flat availability.', 'message_bn' => 'দুজন চাকরিজীবী ফ্ল্যাট খালি আছে কিনা জানতে চেয়েছেন।', 'link' => '/landlord/contact-requests', 'read' => false],
            ['target' => 'landlord', 'user_index' => 5, 'type' => 'visit_request', 'title' => 'KU Student Mess Visit', 'title_bn' => 'খুবি মেস ভিজিট অনুরোধ', 'message' => 'Student requested afternoon tour of scholars mess.', 'message_bn' => 'ছাত্র স্কলার্স মেস পরিদর্শনের অনুরোধ জানিয়েছেন।', 'link' => '/landlord/visits', 'read' => true],
            ['target' => 'landlord', 'user_index' => 6, 'type' => 'message_received', 'title' => 'New Chat Message Received', 'title_bn' => 'নতুন চ্যাট বার্তা এসেছে', 'message' => 'Tenant sent a query about AC backup support.', 'message_bn' => 'ভাড়াটিয়া এসি ব্যাকআপ নিয়ে বার্তা পাঠিয়েছেন।', 'link' => '/landlord/messages', 'read' => false],
            ['target' => 'landlord', 'user_index' => 7, 'type' => 'property_approved', 'title' => 'Penthouse Listing Approved', 'title_bn' => 'পেন্টহাউস তালিকা অনুমোদিত হয়েছে', 'message' => 'Your KDA Avenue duplex penthouse is now live on Thikana.', 'message_bn' => 'আপনার কেডিএ এভিনিউ ডুপ্লেক্স পেন্টহাউস এখন ঠিকানায় লাইভ রয়েছে।', 'link' => '/properties/kda-avenue-royal-duplex-penthouse', 'read' => true],
            ['target' => 'landlord', 'user_index' => 7, 'type' => 'visit_request', 'title' => 'High-Priority Penthouse Visit', 'title_bn' => 'পেন্টহাউসে গুরুত্বপূর্ণ ভিজিট', 'message' => 'Business family confirmed viewing for Sunday morning.', 'message_bn' => 'ব্যবসায়ী পরিবার রবিবার সকালের ভিজিট নিশ্চিত করেছেন।', 'link' => '/landlord/visits', 'read' => false],

            // Tenant notifications (22) -> Total 35
            ['target' => 'tenant', 'user_index' => 0, 'type' => 'visit_status', 'title' => 'Visit Request Accepted!', 'title_bn' => 'ভিজিট অনুরোধ গৃহীত হয়েছে!', 'message' => 'Landlord accepted your visit for Green Villa 3A on Friday.', 'message_bn' => 'বাড়িওয়ালা শুক্রবার গ্রীন ভিলা ৩এ ভিজিট অনুরোধ গ্রহণ করেছেন।', 'link' => '/tenant/visits', 'read' => false],
            ['target' => 'tenant', 'user_index' => 0, 'type' => 'price_drop', 'title' => 'Favorite Listing Updated', 'title_bn' => 'পছন্দের তালিকায় আপডেট', 'message' => 'One of your saved properties in Sonadanga updated its rent.', 'message_bn' => 'সোনাডাঙ্গায় আপনার পছন্দের একটি ফ্ল্যাটের ভাড়ায় পরিবর্তন এসেছে।', 'link' => '/tenant/favorites', 'read' => true],
            ['target' => 'tenant', 'user_index' => 1, 'type' => 'message_received', 'title' => 'Landlord Replied to Your Chat', 'title_bn' => 'বাড়িওয়ালা আপনার বার্তার উত্তর দিয়েছেন', 'message' => 'Landlord confirmed WiFi and water utilities are included.', 'message_bn' => 'বাড়িওয়ালা ওয়াইফাই ও পানি সুবিধা অন্তর্ভুক্ত থাকার বিষয়টি নিশ্চিত করেছেন।', 'link' => '/tenant/messages', 'read' => false],
            ['target' => 'tenant', 'user_index' => 2, 'type' => 'contact_status', 'title' => 'Inquiry Accepted by Landlord', 'title_bn' => 'বাড়িওয়ালা অনুসন্ধান গ্রহণ করেছেন', 'message' => 'Landlord provided contact details for Mujgunni flat.', 'message_bn' => 'মুজগুন্নি ফ্ল্যাটের বাড়িওয়ালা যোগাযোগের নম্বর প্রদান করেছেন।', 'link' => '/tenant/dashboard', 'read' => true],
            ['target' => 'tenant', 'user_index' => 3, 'type' => 'visit_status', 'title' => 'Gate Pass Issued for Nirala Tower', 'title_bn' => 'নিরালা টাওয়ারের গেট পাস ইস্যু হয়েছে', 'message' => 'Your Saturday visit is confirmed with private gate security.', 'message_bn' => 'আপনার শনিবারের ভিজিটের নিরাপত্তা ছাড়পত্র সম্পন্ন হয়েছে।', 'link' => '/tenant/visits', 'read' => false],
            ['target' => 'tenant', 'user_index' => 4, 'type' => 'recommendation', 'title' => 'New Matches for Your Preferences', 'title_bn' => 'আপনার পছন্দের সাথে মিলে এমন নতুন বাসা', 'message' => '2 new 2BHK family flats listed in Mujgunni under ৳12,000.', 'message_bn' => 'মুজগুন্নিতে ১২,০০০ টাকার মধ্যে ২টি নতুন ২ রুমের ফ্ল্যাট তালিকাভুক্ত হয়েছে।', 'link' => '/properties', 'read' => true],
            ['target' => 'tenant', 'user_index' => 5, 'type' => 'review_approved', 'title' => 'Your Review Was Published', 'title_bn' => 'আপনার রিভিউটি প্রকাশিত হয়েছে', 'message' => 'Your review on Scholars Mess has been approved and is now live.', 'message_bn' => 'স্কলার্স মেস নিয়ে আপনার রিভিউটি অনুমোদিত হয়ে লাইভ রয়েছে।', 'link' => '/tenant/reviews', 'read' => true],
            ['target' => 'tenant', 'user_index' => 6, 'type' => 'visit_status', 'title' => 'Visit Successfully Completed', 'title_bn' => 'ভিজিট সফলভাবে সম্পন্ন হয়েছে', 'message' => 'Thank you for visiting Skyline Apartment. Please leave a review!', 'message_bn' => 'স্কাইলাইন ফ্ল্যাটটি দেখার জন্য ধন্যবাদ। আপনার অভিজ্ঞতা শেয়ার করুন!', 'link' => '/tenant/reviews', 'read' => false],
            ['target' => 'tenant', 'user_index' => 7, 'type' => 'message_received', 'title' => 'New Message from Landlord', 'title_bn' => 'বাড়িওয়ালার কাছ থেকে নতুন বার্তা', 'message' => 'Landlord has prepared the lease contract draft for review.', 'message_bn' => 'বাড়িওয়ালা চুক্তিপত্রের খসড়া পর্যালোচনার জন্য প্রস্তুত করেছেন।', 'link' => '/tenant/messages', 'read' => false],
            ['target' => 'tenant', 'user_index' => 8, 'type' => 'system', 'title' => 'Welcome to Thikana!', 'title_bn' => 'ঠিকানায় আপনাকে স্বাগতম!', 'message' => 'Discover verified, authentic rental homes across Khulna.', 'message_bn' => 'খুলনায় যাচাইকৃত নির্ভরযোগ্য বাসা খুঁজে নিন সহজেই।', 'link' => '/properties', 'read' => true],
            ['target' => 'tenant', 'user_index' => 9, 'type' => 'visit_status', 'title' => 'Visit Cancelled Successfully', 'title_bn' => 'ভিজিট সফলভাবে বাতিল করা হয়েছে', 'message' => 'Your visit cancellation for Daulatpur flat was processed.', 'message_bn' => 'দৌলতপুর ফ্ল্যাটের ভিজিট বাতিলের প্রক্রিয়া সম্পন্ন হয়েছে।', 'link' => '/tenant/visits', 'read' => true],
            ['target' => 'tenant', 'user_index' => 10, 'type' => 'recommendation', 'title' => 'Trending Bachelor Flats in Boyra', 'title_bn' => 'বয়রায় জনপ্রিয় ব্যাচেলর ফ্ল্যাট', 'message' => 'Check out newly verified sublet rooms near Medical College.', 'message_bn' => 'মেডিকেল কলেজের কাছে নতুন যাচাইকৃত রুমগুলো দেখুন।', 'link' => '/properties', 'read' => false],
            ['target' => 'tenant', 'user_index' => 11, 'type' => 'contact_status', 'title' => 'Landlord Responded to Inquiry', 'title_bn' => 'বাড়িওয়ালা আপনার অনুসন্ধানে সাড়া দিয়েছেন', 'message' => 'Landlord confirmed visit schedule for Choto Boyra home.', 'message_bn' => 'ছোট বয়রার বাসার বাড়িওয়ালা ভিজিটের সময়সূচি নিশ্চিত করেছেন।', 'link' => '/tenant/dashboard', 'read' => true],
            ['target' => 'tenant', 'user_index' => 12, 'type' => 'visit_status', 'title' => 'Visit Request Scheduled', 'title_bn' => 'ভিজিট অনুরোধ নির্ধারিত হয়েছে', 'message' => 'Visit scheduled for female student sublet room in Sonadanga.', 'message_bn' => 'সোনাডাঙ্গায় ছাত্রী সাবলেট রুম পরিদর্শনের সময় নির্ধারিত হয়েছে।', 'link' => '/tenant/visits', 'read' => false],
            ['target' => 'tenant', 'user_index' => 13, 'type' => 'report_status', 'title' => 'Report Under Investigation', 'title_bn' => 'রিপোর্টটি তদন্তাধীন রয়েছে', 'message' => 'Admin is reviewing your report on deceptive photos.', 'message_bn' => 'ভুল ছবি সংক্রান্ত আপনার অভিযোগটি অ্যাডমিন পর্যালোচনা করছেন।', 'link' => '/tenant/dashboard', 'read' => true],
            ['target' => 'tenant', 'user_index' => 14, 'type' => 'recommendation', 'title' => 'Duplex Listings Matching Budget', 'title_bn' => 'আপনার বাজেটের মধ্যে ডুপ্লেক্স বাসা', 'message' => 'Explore luxury duplex options in Nirala and KDA Avenue.', 'message_bn' => 'নিরালা ও কেডিএ এভিনিউতে আধুনিক ডুপ্লেক্স বাসাগুলো দেখুন।', 'link' => '/properties', 'read' => false],
            ['target' => 'tenant', 'user_index' => 15, 'type' => 'system', 'title' => 'Profile Verification Complete', 'title_bn' => 'প্রোফাইল যাচাইকরণ সম্পন্ন হয়েছে', 'message' => 'Your mobile number and email have been successfully verified.', 'message_bn' => 'আপনার মোবাইল নম্বর ও ইমেইল সফলভাবে যাচাই করা হয়েছে।', 'link' => '/tenant/dashboard', 'read' => true],
            ['target' => 'tenant', 'user_index' => 16, 'type' => 'visit_status', 'title' => 'Reminder: Upcoming Visit Tomorrow', 'title_bn' => 'স্মারক: আগামীকাল আপনার নির্ধারিত ভিজিট', 'message' => 'You have a confirmed visit tomorrow morning at Shibbari Skyline.', 'message_bn' => 'আগামীকাল সকালে শিববাড়ি স্কাইলাইনে আপনার একটি ভিজিট রয়েছে।', 'link' => '/tenant/visits', 'read' => false],
            ['target' => 'tenant', 'user_index' => 17, 'type' => 'message_received', 'title' => 'Unread Message from Landlord', 'title_bn' => 'বাড়িওয়ালার অপঠিত বার্তা', 'message' => 'Landlord asked for confirmation on preferred move-in date.', 'message_bn' => 'বাড়িওয়ালা কবে থেকে উঠতে চান তা নিশ্চিত করতে অনুরোধ করেছেন।', 'link' => '/tenant/messages', 'read' => false],
            ['target' => 'tenant', 'user_index' => 18, 'type' => 'favorite_update', 'title' => 'Availability Status Changed', 'title_bn' => 'বাসার খালি থাকার তথ্যে পরিবর্তন', 'message' => 'One of your favorites in Sonadanga is now marked Rented.', 'message_bn' => 'সোনাডাঙ্গায় আপনার পছন্দের একটি বাসা ভাড়া হয়ে গেছে।', 'link' => '/tenant/favorites', 'read' => true],
            ['target' => 'tenant', 'user_index' => 19, 'type' => 'system', 'title' => 'Security Notice', 'title_bn' => 'নিরাপত্তা বিজ্ঞপ্তি', 'message' => 'Always inspect rental premises in daylight before paying advance deposits.', 'message_bn' => 'অগ্রিম টাকা লেনদেনের পূর্বে দিনের আলোতে বাসা সরেজমিনে পরিদর্শন করুন।', 'link' => '/properties', 'read' => true],
            ['target' => 'tenant', 'user_index' => 19, 'type' => 'recommendation', 'title' => 'New Listings in Khulna', 'title_bn' => 'খুলনায় নতুন বিজ্ঞাপন', 'message' => 'Explore newly added verified properties matching your budget.', 'message_bn' => 'আপনার বাজেটের মধ্যে নতুন যুক্ত হওয়া যাচাইকৃত বাসাগুলো দেখুন।', 'link' => '/properties', 'read' => false],
        ];
    }
}
