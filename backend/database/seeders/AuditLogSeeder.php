<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Property;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    /**
     * Seed 35 administrative audit log entries.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@demo.test')->first();
        $adminName = $admin instanceof User ? $admin->name : 'System Administrator';
        $adminId = $admin?->id;

        $properties = Property::orderBy('id')->get();
        $tenants = User::where('email', 'like', 'tenant%@demo.test')->orderBy('id')->get();

        $baseDate = Carbon::create(2026, 11, 1, 12, 0, 0);

        $logEntries = [
            // Property Approvals
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 0, 'details' => 'Listing "Green Villa Luxury 3BHK" approved after verification of landlord ownership and utility bills.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 1, 'details' => 'Listing "Single Attached Bath Room near Khulna Medical College" approved.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 2, 'details' => 'Listing "Peace Haven 2BHK Apartment in Mujgunni" approved.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 3, 'details' => 'Listing "Nirala Prime Tower 3BHK Executive Flat" approved with priority verification status.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 4, 'details' => 'Listing "Budget 2BHK Bachelor Flat near BIDC Road" approved.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 5, 'details' => 'Listing "Scholars Student Mess Room near Khulna University" approved.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 6, 'details' => 'Listing "Skyline 3BHK Luxury Apartment at Shibbari Mor" approved.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 7, 'details' => 'Listing "Royal 4BHK Duplex Penthouse on KDA Avenue" approved after legal deed validation.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 8, 'details' => 'Listing "2BHK Bachelor Flat near BL College" approved.'],
            ['action' => 'property_approved', 'target_type' => 'Property', 'index' => 9, 'details' => 'Listing "Sunlit 2BHK Family Home in Choto Boyra" approved.'],

            // Property Rejections
            ['action' => 'property_rejected', 'target_type' => 'Property', 'index' => 33, 'details' => 'Listing rejected: uploaded photos showed luxury interior whereas actual site was under construction.'],
            ['action' => 'property_rejected', 'target_type' => 'Property', 'index' => 34, 'details' => 'Listing rejected: landlord demanded double rent in private phone calls compared to listing.'],

            // Property Verifications
            ['action' => 'property_verified', 'target_type' => 'Property', 'index' => 0, 'details' => 'Badge "nid_matched" verified by admin after national identity database check.'],
            ['action' => 'property_verified', 'target_type' => 'Property', 'index' => 0, 'details' => 'Badge "holding_tax_verified" issued following municipal tax receipt validation.'],
            ['action' => 'property_verified', 'target_type' => 'Property', 'index' => 0, 'details' => 'Badge "physically_inspected" issued following on-site agent inspection.'],
            ['action' => 'property_verified', 'target_type' => 'Property', 'index' => 3, 'details' => 'Badges "nid_matched" and "holding_tax_verified" issued for Nirala Tower.'],
            ['action' => 'property_verified', 'target_type' => 'Property', 'index' => 6, 'details' => 'All 3 verification badges confirmed for Skyline Shibbari.'],
            ['action' => 'property_verified', 'target_type' => 'Property', 'index' => 7, 'details' => 'Physical inspection completed and badge awarded for KDA Penthouse.'],

            // Review Moderation
            ['action' => 'review_approved', 'target_type' => 'Review', 'index' => 0, 'details' => 'Approved resident review for Sonadanga Green Villa from Rafi Ahmed.'],
            ['action' => 'review_approved', 'target_type' => 'Review', 'index' => 1, 'details' => 'Approved verified visit review for Boyra Medical Room.'],
            ['action' => 'review_approved', 'target_type' => 'Review', 'index' => 2, 'details' => 'Approved 5-star review for Nirala Prime Tower.'],
            ['action' => 'review_approved', 'target_type' => 'Review', 'index' => 3, 'details' => 'Approved student review for KU Scholars Mess.'],
            ['action' => 'review_rejected', 'target_type' => 'Review', 'index' => 23, 'details' => 'Rejected spam promotional review containing third-party hotel affiliate numbers.'],
            ['action' => 'review_rejected', 'target_type' => 'Review', 'index' => 24, 'details' => 'Rejected unverified speculative review based on personal aesthetic preferences.'],

            // User Management & Security Actions
            ['action' => 'user_status_updated', 'target_type' => 'User', 'index' => 19, 'details' => 'Tenant account "tenant20@demo.test" suspended due to repeated spam inquiries.'],
            ['action' => 'user_verified', 'target_type' => 'User', 'index' => 0, 'details' => 'Tenant phone number "01711111111" verified via SMS OTP.'],
            ['action' => 'user_verified', 'target_type' => 'User', 'index' => 1, 'details' => 'Tenant email "tenant2@demo.test" verified via signed activation link.'],

            // Community Information Moderation
            ['action' => 'community_info_updated', 'target_type' => 'CommunityInformation', 'index' => 0, 'details' => 'Updated Sonadanga R/A community profile: added new bus route advisory and drainage upgrade notice.'],
            ['action' => 'community_info_updated', 'target_type' => 'CommunityInformation', 'index' => 1, 'details' => 'Updated Boyra community profile: verified 24/7 emergency pharmacy proximity.'],
            ['action' => 'community_info_updated', 'target_type' => 'CommunityInformation', 'index' => 2, 'details' => 'Updated Gollamari community profile: added student bicycle security tips.'],

            // Report Resolutions
            ['action' => 'report_resolved', 'target_type' => 'PropertyReport', 'index' => 0, 'details' => 'Resolved report #1: listing photos found deceptive, property delisted, landlord issued official warning.'],
            ['action' => 'report_resolved', 'target_type' => 'PropertyReport', 'index' => 1, 'details' => 'Resolved report #2: rent mismatch confirmed, listing removed.'],
            ['action' => 'report_resolved', 'target_type' => 'PropertyReport', 'index' => 2, 'details' => 'Resolved report #3: confirmed property was rented, status changed from Available to Rented.'],
            ['action' => 'report_dismissed', 'target_type' => 'PropertyReport', 'index' => 3, 'details' => 'Dismissed report #4: landlord communication delay was due to rural travel.'],
            ['action' => 'report_resolved', 'target_type' => 'PropertyReport', 'index' => 4, 'details' => 'Resolved report #5: geocoding coordinates adjusted for Khalishpur listing.'],
        ];

        foreach ($logEntries as $idx => $entry) {
            $targetId = match ($entry['target_type']) {
                'Property' => $properties->isNotEmpty() ? (string) $properties[$entry['index'] % $properties->count()]->id : '1',
                'User' => $tenants->isNotEmpty() ? (string) $tenants[$entry['index'] % $tenants->count()]->id : '1',
                'Review' => (string) ($entry['index'] + 1),
                'CommunityInformation' => (string) ($entry['index'] + 1),
                'PropertyReport' => (string) ($entry['index'] + 1),
            };

            $createdAt = $baseDate->copy()->subDays(30 - ($idx % 30))->subMinutes($idx * 17);

            AuditLog::firstOrCreate(
                [
                    'actor_id' => $adminId,
                    'action' => $entry['action'],
                    'target_type' => $entry['target_type'],
                    'target_id' => $targetId,
                    'details' => $entry['details'],
                ],
                [
                    'actor_name' => $adminName,
                    'created_at' => $createdAt,
                ]
            );
        }
    }
}
