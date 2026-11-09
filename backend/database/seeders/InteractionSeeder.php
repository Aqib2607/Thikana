<?php

namespace Database\Seeders;

use App\Models\ContactRequest;
use App\Models\Favorite;
use App\Models\Property;
use App\Models\PropertyComparison;
use App\Models\PropertyReport;
use App\Models\Review;
use App\Models\User;
use App\Models\VisitRequest;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class InteractionSeeder extends Seeder
{
    /**
     * Seed user interactions: favorites, comparisons, reviews, contacts, visits, and reports.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@demo.test')->first();
        $tenants = User::where('email', 'like', 'tenant%@demo.test')->orderBy('id')->get();
        $approvedProperties = Property::where('approval_status', 'Approved')->orderBy('id')->get();
        $allProperties = Property::orderBy('id')->get();

        if ($tenants->isEmpty() || $approvedProperties->isEmpty()) {
            return;
        }

        // 1. Seed 30 Favorites
        $favCount = 0;
        foreach ($tenants as $tIndex => $tenant) {
            // Assign 1 to 3 favorites per tenant
            $numFavs = ($tIndex % 3) + 1;
            for ($f = 0; $f < $numFavs && $favCount < 30; $f++) {
                $prop = $approvedProperties[($tIndex * 2 + $f) % $approvedProperties->count()];
                Favorite::firstOrCreate([
                    'user_id' => $tenant->id,
                    'property_id' => $prop->id,
                ]);
                $favCount++;
            }
        }

        // 2. Seed 12 Property Comparisons across active tenants
        $compCount = 0;
        foreach ($tenants->take(4) as $tIndex => $tenant) {
            // Give 3 comparison slots each
            for ($c = 0; $c < 3 && $compCount < 12; $c++) {
                $prop = $approvedProperties[($tIndex * 3 + $c) % $approvedProperties->count()];
                PropertyComparison::firstOrCreate(
                    [
                        'user_id' => $tenant->id,
                        'property_id' => $prop->id,
                    ],
                    [
                        'display_order' => $c + 1,
                    ]
                );
                $compCount++;
            }
        }

        // 3. Seed 25 Multi-Criteria Reviews
        $reviewsData = $this->getReviewsData();
        foreach ($reviewsData as $index => $rData) {
            $prop = $approvedProperties[$rData['property_index'] % $approvedProperties->count()];
            $tenant = $tenants[$rData['tenant_index'] % $tenants->count()];

            Review::updateOrCreate(
                [
                    'property_id' => $prop->id,
                    'tenant_id' => $tenant->id,
                ],
                [
                    'overall_rating' => $rData['overall_rating'],
                    'accuracy_rating' => $rData['accuracy_rating'],
                    'landlord_behavior_rating' => $rData['landlord_behavior_rating'],
                    'location_rating' => $rData['location_rating'],
                    'overall_experience_rating' => $rData['overall_experience_rating'],
                    'comment' => $rData['comment'],
                    'visited_verified' => $rData['visited_verified'],
                    'status' => $rData['status'],
                    'admin_notes' => $rData['admin_notes'] ?? null,
                    'moderated_by' => ($rData['status'] !== 'pending') ? $admin?->id : null,
                    'moderated_at' => ($rData['status'] !== 'pending') ? now()->subDays($index) : null,
                ]
            );
        }

        // Recalculate property average ratings and review counts from approved reviews
        foreach ($approvedProperties as $property) {
            $approvedReviews = Review::where('property_id', $property->id)
                ->where('status', 'approved')
                ->get();

            if ($approvedReviews->isNotEmpty()) {
                $property->update([
                    'rating' => round((float) $approvedReviews->avg('overall_rating'), 2),
                    'review_count' => $approvedReviews->count(),
                ]);
            }
        }

        $baseDate = Carbon::create(2026, 11, 1, 12, 0, 0);

        // 4. Seed 20 Contact Requests
        $contactRequestsData = $this->getContactRequestsData();
        foreach ($contactRequestsData as $cIndex => $crData) {
            $prop = $approvedProperties[$crData['property_index'] % $approvedProperties->count()];
            $tenant = $tenants[$crData['tenant_index'] % $tenants->count()];

            ContactRequest::firstOrCreate(
                [
                    'property_id' => $prop->id,
                    'tenant_id' => $tenant->id,
                    'message' => $crData['message'],
                ],
                [
                    'landlord_id' => $prop->landlord_id,
                    'phone' => $tenant->phone ?? '01711111111',
                    'status' => $crData['status'],
                    'landlord_note' => $crData['landlord_note'] ?? null,
                    'responded_at' => ($crData['status'] !== 'pending') ? $baseDate->copy()->subDays(24 - $cIndex) : null,
                    'created_at' => $baseDate->copy()->subDays(25 - $cIndex),
                ]
            );
        }

        // 5. Seed 16 Visit Requests
        $visitRequestsData = $this->getVisitRequestsData();
        foreach ($visitRequestsData as $vIndex => $vrData) {
            $prop = $approvedProperties[$vrData['property_index'] % $approvedProperties->count()];
            $tenant = $tenants[$vrData['tenant_index'] % $tenants->count()];

            VisitRequest::firstOrCreate(
                [
                    'property_id' => $prop->id,
                    'tenant_id' => $tenant->id,
                    'visit_date' => $baseDate->copy()->addDays($vIndex - 5)->toDateString(),
                    'preferred_time_slot' => $vrData['time_slot'],
                ],
                [
                    'landlord_id' => $prop->landlord_id,
                    'notes' => $vrData['notes'],
                    'status' => $vrData['status'],
                    'cancellation_reason' => $vrData['cancellation_reason'] ?? null,
                    'landlord_notes' => $vrData['landlord_notes'] ?? null,
                ]
            );
        }

        // 6. Seed 8 Property Reports
        $reportsData = $this->getPropertyReportsData();
        foreach ($reportsData as $rIndex => $rpData) {
            $prop = $allProperties[$rpData['property_index'] % $allProperties->count()];
            $reporter = $tenants[$rpData['reporter_index'] % $tenants->count()];

            PropertyReport::firstOrCreate(
                [
                    'property_id' => $prop->id,
                    'reporter_id' => $reporter->id,
                    'reason' => $rpData['reason'],
                ],
                [
                    'details' => $rpData['details'],
                    'status' => $rpData['status'],
                    'admin_notes' => $rpData['admin_notes'] ?? null,
                    'resolved_by' => ($rpData['status'] !== 'pending') ? $admin?->id : null,
                    'resolved_at' => ($rpData['status'] !== 'pending') ? now()->subDays(2) : null,
                ]
            );
        }
    }

    /**
     * 25 diverse reviews with realistic comments and statuses.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getReviewsData(): array
    {
        return [
            [
                'property_index' => 0,
                'tenant_index' => 0,
                'overall_rating' => 4.80,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'চমৎকার ফ্ল্যাট! সোনাডাঙ্গা আবাসিক এলাকার পরিবেশ অত্যন্ত শান্ত। বাড়িওয়ালা অত্যন্ত বিনয়ী ও সহযোগিতাপূর্ণ।',
                'visited_verified' => true,
                'status' => 'approved',
                'admin_notes' => 'Verified resident review with authentic visit proof.',
            ],
            [
                'property_index' => 0,
                'tenant_index' => 1,
                'overall_rating' => 4.75,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 4,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'The rooms are spacious and receive plenty of morning sunlight. Elevator service is very smooth.',
                'visited_verified' => true,
                'status' => 'approved',
                'admin_notes' => 'Approved following guidelines.',
            ],
            [
                'property_index' => 0,
                'tenant_index' => 2,
                'overall_rating' => 4.85,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'নিরাপত্তা প্রহরী ও সিসিটিভি ব্যবস্থা খুব ভালো। পরিবারের সাথে নিরাপদে থাকার সেরা জায়গা।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 1,
                'tenant_index' => 3,
                'overall_rating' => 4.60,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'খুলনা মেডিকেল কলেজের কাছে হওয়ায় ইন্টার্ন চিকিৎসকদের জন্য উপযুক্ত। ওয়াইফাই স্পিডও চমৎকার।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 1,
                'tenant_index' => 4,
                'overall_rating' => 4.60,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 4,
                'location_rating' => 5,
                'overall_experience_rating' => 4,
                'comment' => 'Very convenient room for medical students. Meal system was reliable and punctual.',
                'visited_verified' => false,
                'status' => 'approved',
            ],
            [
                'property_index' => 2,
                'tenant_index' => 5,
                'overall_rating' => 4.50,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 4,
                'location_rating' => 4,
                'overall_experience_rating' => 5,
                'comment' => 'মুজগুন্নি কাঁচাবাজার খুব কাছেই। পানি বা গ্যাসের কোনো সমস্যা নেই।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 2,
                'tenant_index' => 6,
                'overall_rating' => 4.50,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 5,
                'location_rating' => 4,
                'overall_experience_rating' => 5,
                'comment' => 'Affordable and well-ventilated flat. The landlord promptly resolved minor plumbing repairs.',
                'visited_verified' => false,
                'status' => 'approved',
            ],
            [
                'property_index' => 3,
                'tenant_index' => 7,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'নিরালা প্রাইম টাওয়ারের সিকিউরিটি ও রুফটপ গার্ডেন এক কথায় অসাধারণ। প্রিমিয়াম লিভিং।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 3,
                'tenant_index' => 8,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Luxurious finishing with top brand sanitary fittings. Highly recommend for corporate executives.',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 3,
                'tenant_index' => 9,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'নিরালা পার্কের ঠিক পাশেই। বাচ্চাদের খেলার জন্য সুন্দর পরিবেশ।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 3,
                'tenant_index' => 10,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Full generator backup during load-shedding is a lifesaver. Excellent property management.',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 4,
                'tenant_index' => 11,
                'overall_rating' => 4.20,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 4,
                'location_rating' => 4,
                'overall_experience_rating' => 4,
                'comment' => 'ব্যাচেলরদের জন্য কম খরচে থাকার জন্য ভালো জায়গা। মোড়ে ইজিবাইক পাওয়া যায়।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 4,
                'tenant_index' => 12,
                'overall_rating' => 4.20,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 4,
                'location_rating' => 5,
                'overall_experience_rating' => 4,
                'comment' => 'Good value for money. Bike parking is secure inside the boundary gate.',
                'visited_verified' => false,
                'status' => 'approved',
            ],
            [
                'property_index' => 5,
                'tenant_index' => 13,
                'overall_rating' => 4.40,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 4,
                'location_rating' => 5,
                'overall_experience_rating' => 4,
                'comment' => 'খুবি ক্যাম্পাসের খুব কাছে। হেঁটে ক্লাসে যাওয়া যায়। পড়াশোনার চমৎকার পরিবেশ।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 5,
                'tenant_index' => 14,
                'overall_rating' => 4.40,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 4,
                'location_rating' => 5,
                'overall_experience_rating' => 4,
                'comment' => 'Ideal student mess. The monthly meal accounting is transparent and fair.',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 5,
                'tenant_index' => 15,
                'overall_rating' => 4.40,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 4,
                'comment' => 'খাবারের মান ভালো এবং মেসের ভাইদের আচরণ আন্তরিক।',
                'visited_verified' => false,
                'status' => 'approved',
            ],
            [
                'property_index' => 6,
                'tenant_index' => 16,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'শিববাড়ি মোড়ের প্রাণকেন্দ্রে এমন নিরিবিলি আধুনিক ফ্ল্যাট পাওয়া সত্যিই ভাগ্যের বিষয়।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 6,
                'tenant_index' => 17,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'Breathtaking 7th-floor balcony view and instant connectivity to any part of Khulna.',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 6,
                'tenant_index' => 18,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'ফ্যামিলির জন্য খুবই নিরাপদ। ব্যাংকার ও ডাক্তার পরিবারের বাস।',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            [
                'property_index' => 6,
                'tenant_index' => 19,
                'overall_rating' => 4.90,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 5,
                'comment' => 'High quality lift and 24-hour generator support. Five star rating!',
                'visited_verified' => true,
                'status' => 'approved',
            ],
            // 21. Pending Moderation Review 1
            [
                'property_index' => 7,
                'tenant_index' => 0,
                'overall_rating' => 4.80,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 5,
                'location_rating' => 5,
                'overall_experience_rating' => 4,
                'comment' => 'পেন্টহাউসটি খুব সুন্দর তবে সার্ভিস চার্জ কিছুটা বেশি বলে মনে হয়েছে। [Pending review]',
                'visited_verified' => true,
                'status' => 'pending',
                'admin_notes' => null,
            ],
            // 22. Pending Moderation Review 2
            [
                'property_index' => 8,
                'tenant_index' => 1,
                'overall_rating' => 4.00,
                'accuracy_rating' => 4,
                'landlord_behavior_rating' => 4,
                'location_rating' => 4,
                'overall_experience_rating' => 4,
                'comment' => 'Decent apartment near BL college, but nighttime street lighting could be improved.',
                'visited_verified' => false,
                'status' => 'pending',
                'admin_notes' => null,
            ],
            // 23. Pending Moderation Review 3
            [
                'property_index' => 9,
                'tenant_index' => 2,
                'overall_rating' => 4.50,
                'accuracy_rating' => 5,
                'landlord_behavior_rating' => 4,
                'location_rating' => 4,
                'overall_experience_rating' => 5,
                'comment' => 'ছোট বয়রায় বেশ আরামদায়ক পরিবেশ। পরিবারের জন্য ভালো।',
                'visited_verified' => true,
                'status' => 'pending',
                'admin_notes' => null,
            ],
            // 24. Rejected Moderation Review 1 (Spam / Abusive)
            [
                'property_index' => 1,
                'tenant_index' => 10,
                'overall_rating' => 1.00,
                'accuracy_rating' => 1,
                'landlord_behavior_rating' => 1,
                'location_rating' => 1,
                'overall_experience_rating' => 1,
                'comment' => 'Fraud ad call me at 01999999999 for cheap hotel deals! Visit my telegram channel.',
                'visited_verified' => false,
                'status' => 'rejected',
                'admin_notes' => 'Spam advertisement and promotional phone number detected. Rejected.',
            ],
            // 25. Rejected Moderation Review 2 (Irrelevant content)
            [
                'property_index' => 2,
                'tenant_index' => 11,
                'overall_rating' => 2.00,
                'accuracy_rating' => 2,
                'landlord_behavior_rating' => 2,
                'location_rating' => 2,
                'overall_experience_rating' => 2,
                'comment' => 'Not visited but rating 2 stars because I dislike the color of the curtains.',
                'visited_verified' => false,
                'status' => 'rejected',
                'admin_notes' => 'Non-resident unverified speculative review violating community review policy.',
            ],
        ];
    }

    /**
     * 20 realistic contact requests.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getContactRequestsData(): array
    {
        return [
            ['property_index' => 0, 'tenant_index' => 0, 'status' => 'accepted', 'message' => 'আসসালামু আলাইকুম। ফ্ল্যাটটি কি আগামী মাসের ১ তারিখ থেকে খালি হবে? আমরা ৩ জনের একটি ছোট পরিবার।', 'landlord_note' => 'ওয়ালাইকুম আসসালাম। হ্যাঁ খালি হবে, অনুগ্রহ করে ফোনে যোগাযোগ করুন।'],
            ['property_index' => 0, 'tenant_index' => 1, 'status' => 'accepted', 'message' => 'Hello, is car parking included with the apartment rent?', 'landlord_note' => 'Yes, one designated covered parking slot is included.'],
            ['property_index' => 1, 'tenant_index' => 2, 'status' => 'accepted', 'message' => 'আমি খুলনা মেডিকেল কলেজের ফাইনাল ইয়ারের ছাত্র। রুমটি কি এখনো অ্যাভেইলেবল আছে?', 'landlord_note' => 'হ্যাঁ অ্যাভেইলেবল। বিকেলে এসে দেখে যেতে পারেন।'],
            ['property_index' => 1, 'tenant_index' => 3, 'status' => 'rejected', 'message' => 'আমরা ৪ জন বন্ধু একসাথে থাকতে চাই। মেস ভাড়া দেওয়া যাবে?', 'landlord_note' => 'দুঃখিত, এই রুমে সর্বোচ্চ ২ জন ছাত্র থাকতে পারবে।'],
            ['property_index' => 2, 'tenant_index' => 4, 'status' => 'accepted', 'message' => 'মুজগুন্নির ফ্ল্যাটটি দেখতে আগ্রহী। এডভান্স কত মাসের দিতে হবে?', 'landlord_note' => '২ মাসের এডভান্স প্রযোজ্য। সরাসরি দেখা করে কথা বলতে পারেন।'],
            ['property_index' => 3, 'tenant_index' => 5, 'status' => 'accepted', 'message' => 'We are relocating from Dhaka for a corporate bank posting. We would like to finalize this Nirala flat.', 'landlord_note' => 'Welcome to Khulna! Please call me at your convenience.'],
            ['property_index' => 4, 'tenant_index' => 6, 'status' => 'pending', 'message' => 'খালিশপুরের ফ্ল্যাটে কি নিরবচ্ছিন্ন গ্যাস সংযোগ আছে?', 'landlord_note' => null],
            ['property_index' => 5, 'tenant_index' => 7, 'status' => 'accepted', 'message' => 'খুবিতে অর্থনীতি বিভাগে ভর্তি হয়েছি। মেসে ১ সিট খালি আছে কি?', 'landlord_note' => 'হ্যাঁ, সিট খালি আছে। কাল এসে ভর্তি কনফার্ম করতে পারেন।'],
            ['property_index' => 6, 'tenant_index' => 8, 'status' => 'accepted', 'message' => 'শিববাড়ির ফ্ল্যাটটির ভাড়া কি সামান্য বিবেচনা করার সুযোগ আছে?', 'landlord_note' => 'সরাসরি আসলে সামান্য আলোচনা করা যেতে পারে।'],
            ['property_index' => 7, 'tenant_index' => 9, 'status' => 'accepted', 'message' => 'Interested in the KDA Avenue duplex penthouse for our business family.', 'landlord_note' => 'Please visit our office on Sunday morning for contract discussion.'],
            ['property_index' => 8, 'tenant_index' => 10, 'status' => 'pending', 'message' => 'দৌলতপুরের বাসাটিতে কি বাইক গ্যারেজ আছে?', 'landlord_note' => null],
            ['property_index' => 9, 'tenant_index' => 11, 'status' => 'accepted', 'message' => 'ছোট বয়রার বাসাটি কি ফ্যামিলির জন্য ১ ডিসেম্বর থেকে পাওয়া যাবে?', 'landlord_note' => 'হ্যাঁ, বুকিং নেওয়া হচ্ছে।'],
            ['property_index' => 10, 'tenant_index' => 12, 'status' => 'pending', 'message' => 'রূপসার ফ্ল্যাটের সাথে কি সিলিন্ডার গ্যাস ব্যবহার করতে হবে?', 'landlord_note' => null],
            ['property_index' => 11, 'tenant_index' => 13, 'status' => 'accepted', 'message' => 'আমি সোনাডাঙ্গায় একটি সরকারি সংস্থায় ইন্টার্নশিপ করছি। রুমটি দেখতে চাই।', 'landlord_note' => 'আসতে পারেন, দারোয়ান মামা আপনাকে রুমটি দেখাবেন।'],
            ['property_index' => 12, 'tenant_index' => 14, 'status' => 'rejected', 'message' => 'ভাড়া ১২ হাজার টাকায় হবে কি?', 'landlord_note' => 'দুঃখিত, ভাড়া ফিক্সড ১৫ হাজার টাকা।'],
            ['property_index' => 13, 'tenant_index' => 15, 'status' => 'accepted', 'message' => 'মেডিকেলের ইন্টার্নদের জন্য মেসের খাবারের নিয়মাবলী কেমন?', 'landlord_note' => 'দিনে দুই বেলা বুয়া রান্না করে, মিল সিস্টেম।'],
            ['property_index' => 14, 'tenant_index' => 16, 'status' => 'pending', 'message' => 'ডুপ্লেক্স বাড়িটি দেখার জন্য কোন সময় ভালো হবে?', 'landlord_note' => null],
            ['property_index' => 15, 'tenant_index' => 17, 'status' => 'pending', 'message' => 'খালিশপুরের ফ্ল্যাটে পানির কি গভীর নলকূপ আছে?', 'landlord_note' => null],
            ['property_index' => 16, 'tenant_index' => 18, 'status' => 'accepted', 'message' => 'গল্লামারীর ফ্ল্যাটটি দেখতে চাই। শুক্রবার সকাল ১০টায় আসা যাবে?', 'landlord_note' => 'হ্যাঁ, শুক্রবার সকাল ১০টায় আসুন।'],
            ['property_index' => 17, 'tenant_index' => 19, 'status' => 'pending', 'message' => 'শিববাড়ির স্টুডিওতে কি ব্যাচেলর চাকরিজীবীদের দেওয়া হবে?', 'landlord_note' => null],
        ];
    }

    /**
     * 16 realistic visit requests.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getVisitRequestsData(): array
    {
        return [
            ['property_index' => 0, 'tenant_index' => 0, 'time_slot' => 'morning', 'status' => 'completed', 'notes' => 'স্ত্রীসহ এসে ফ্ল্যাটটি সরেজমিনে দেখতে চাই।', 'landlord_notes' => 'ভ্রমণ সফলভাবে সম্পন্ন হয়েছে। পরিবার ফ্ল্যাটটি পছন্দ করেছে।'],
            ['property_index' => 0, 'tenant_index' => 1, 'time_slot' => 'afternoon', 'status' => 'accepted', 'notes' => 'Would like to inspect the building elevator and water pressure.', 'landlord_notes' => 'Confirmed for Friday afternoon at 4:00 PM.'],
            ['property_index' => 1, 'tenant_index' => 2, 'time_slot' => 'evening', 'status' => 'completed', 'notes' => 'মেডিকেল ডিউটি শেষে সন্ধ্যা ৭টায় আসব।', 'landlord_notes' => 'ভিজিট সম্পন্ন। ছাত্র সিট বুকিং করেছে।'],
            ['property_index' => 2, 'tenant_index' => 3, 'time_slot' => 'morning', 'status' => 'pending', 'notes' => 'সকাল ১০টায় এসে ড্রয়িং এবং কিচেন স্পেস দেখতে চাই।', 'landlord_notes' => null],
            ['property_index' => 3, 'tenant_index' => 4, 'time_slot' => 'morning', 'status' => 'accepted', 'notes' => 'Visiting with my parents to inspect security and parking.', 'landlord_notes' => 'Gate pass prepared for visitor.'],
            ['property_index' => 4, 'tenant_index' => 5, 'time_slot' => 'evening', 'status' => 'completed', 'notes' => 'ব্যাচেলর ২ রুমের আলো বাতাস চেক করব।', 'landlord_notes' => 'ভিজিট শেষ হয়েছে।'],
            ['property_index' => 5, 'tenant_index' => 6, 'time_slot' => 'afternoon', 'status' => 'accepted', 'notes' => 'খুবি ক্লাসের পর মেসের রুম ও রিডিং স্পেস দেখতে আসব।', 'landlord_notes' => 'মেস ম্যানেজার রিসিভ করবেন।'],
            ['property_index' => 6, 'tenant_index' => 7, 'time_slot' => 'evening', 'status' => 'completed', 'notes' => 'Looking forward to viewing the 7th-floor city view.', 'landlord_notes' => 'Showed all rooms and balconies.'],
            ['property_index' => 7, 'tenant_index' => 8, 'time_slot' => 'morning', 'status' => 'accepted', 'notes' => 'Inspecting duplex layout for our corporate guest house.', 'landlord_notes' => 'Confirmed for Sunday 11 AM.'],
            ['property_index' => 8, 'tenant_index' => 9, 'time_slot' => 'afternoon', 'status' => 'cancelled', 'notes' => 'জরুরি ব্যক্তিগত কাজে খুলনা ত্যাগ করতে হওয়ায় আসতে পারছি না।', 'cancellation_reason' => 'অনিবার্য জরুরি ভ্রমণজনিত কারণে ভিজিট বাতিল করা হলো।'],
            ['property_index' => 9, 'tenant_index' => 10, 'time_slot' => 'morning', 'status' => 'pending', 'notes' => 'ফ্যামিলিসহ বাসা দেখতে আসব।', 'landlord_notes' => null],
            ['property_index' => 10, 'tenant_index' => 11, 'time_slot' => 'afternoon', 'status' => 'accepted', 'notes' => 'Checking rooftop access and river breeze.', 'landlord_notes' => 'Allowed visit between 3 to 5 PM.'],
            ['property_index' => 11, 'tenant_index' => 12, 'time_slot' => 'evening', 'status' => 'completed', 'notes' => 'ছাত্রীদের রুমের নিরাপত্তা ব্যবস্থা যাচাই করতে অভিভাবকসহ আসছি।', 'landlord_notes' => 'অভিভাবক সন্তুষ্টি প্রকাশ করেছেন।'],
            ['property_index' => 12, 'tenant_index' => 13, 'time_slot' => 'morning', 'status' => 'rejected', 'notes' => 'সকাল ৭টায় দেখতে চাই।', 'landlord_notes' => 'সকাল ৯টার পূর্বে ভিজিট গ্রহণযোগ্য নয়।'],
            ['property_index' => 13, 'tenant_index' => 14, 'time_slot' => 'evening', 'status' => 'pending', 'notes' => 'মেসের মেস ডাইনিং দেখতে আসব।', 'landlord_notes' => null],
            ['property_index' => 14, 'tenant_index' => 15, 'time_slot' => 'afternoon', 'status' => 'pending', 'notes' => 'ডুপ্লেক্সের গ্যারেজ স্পেস ও লন দেখতে চাই।', 'landlord_notes' => null],
        ];
    }

    /**
     * 8 realistic property moderation reports.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getPropertyReportsData(): array
    {
        return [
            [
                'property_index' => 33, // Rejected listing
                'reporter_index' => 0,
                'reason' => 'misleading_photos',
                'details' => 'The uploaded photos show an upscale renovated interior, but upon in-person inspection, the building is unfinished and under dispute.',
                'status' => 'resolved',
                'admin_notes' => 'Investigated physically. Listing description was found deceptive. Listing rejected and landlord issued warning.',
            ],
            [
                'property_index' => 34, // Rejected listing
                'reporter_index' => 1,
                'reason' => 'incorrect_rent',
                'details' => 'Landlord claims rent is 2,800 BDT in the platform listing, but demanded 6,000 BDT when visited.',
                'status' => 'resolved',
                'admin_notes' => 'Confirmed discrepancy via call logs. Listing disabled and rejected.',
            ],
            [
                'property_index' => 27,
                'reporter_index' => 2,
                'reason' => 'already_rented',
                'details' => 'The landlord told me on the phone that this property was rented 2 weeks ago, but it is still marked Available on Thikana.',
                'status' => 'resolved',
                'admin_notes' => 'Contacted landlord. Landlord confirmed property is rented; availability status updated to Rented.',
            ],
            [
                'property_index' => 1,
                'reporter_index' => 3,
                'reason' => 'unresponsive_landlord',
                'details' => 'Tried contacting the landlord multiple times over 3 days, no response to chat or call.',
                'status' => 'dismissed',
                'admin_notes' => 'Landlord was temporarily traveling in rural area with no cellular reception. Communication re-established.',
            ],
            [
                'property_index' => 4,
                'reporter_index' => 4,
                'reason' => 'incorrect_address',
                'details' => 'The map pin places this in Khalishpur center, but the actual building is situated in an outer sub-lane near mill gates.',
                'status' => 'resolved',
                'admin_notes' => 'Geocoding verified and location address corrected in platform records.',
            ],
            [
                'property_index' => 20,
                'reporter_index' => 5,
                'reason' => 'fake_amenities',
                'details' => 'Listing claims IPS backup is available, but the building generator has been out of service for 3 months.',
                'status' => 'pending',
                'admin_notes' => null,
            ],
            [
                'property_index' => 15,
                'reporter_index' => 6,
                'reason' => 'unauthorized_listing',
                'details' => 'Suspected broker listing without genuine owner power of attorney.',
                'status' => 'pending',
                'admin_notes' => null,
            ],
            [
                'property_index' => 8,
                'reporter_index' => 7,
                'reason' => 'duplicate_listing',
                'details' => 'This flat appears to be listed twice with slightly different titles.',
                'status' => 'pending',
                'admin_notes' => null,
            ],
        ];
    }
}
