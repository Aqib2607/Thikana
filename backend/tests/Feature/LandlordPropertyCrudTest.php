<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandlordPropertyCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $landlord;
    protected User $otherLandlord;
    protected string $landlordToken;
    protected string $otherToken;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::firstOrCreate(['slug' => 'landlord'], ['name' => 'Landlord', 'description' => 'Landlord']);

        $this->landlord = new User([
            'name' => 'Primary Landlord',
            'email' => 'primary_landlord@test.com',
            'phone' => '01711119999',
            'password' => bcrypt('Password123!'),
        ]);
        $this->landlord->role_id = $role->id;
        $this->landlord->status = 'active';
        $this->landlord->save();
        $this->landlordToken = $this->landlord->createToken('test', ['role:landlord'])->plainTextToken;

        $this->otherLandlord = new User([
            'name' => 'Other Landlord',
            'email' => 'other_landlord@test.com',
            'phone' => '01722228888',
            'password' => bcrypt('Password123!'),
        ]);
        $this->otherLandlord->role_id = $role->id;
        $this->otherLandlord->status = 'active';
        $this->otherLandlord->save();
        $this->otherToken = $this->otherLandlord->createToken('test', ['role:landlord'])->plainTextToken;
    }

    /**
     * Test landlord can create listing with initial images.
     */
    public function test_landlord_can_create_property_with_valid_data_and_images(): void
    {
        $payload = [
            'title' => 'Brand New 3-Bed Flat in Nirala',
            'banglaTitle' => 'নিরালা ৩ রুমের নতুন ফ্ল্যাট',
            'propertyType' => 'Apartment / Flat',
            'rentalType' => 'Monthly Rental',
            'rent' => 14000,
            'advance' => 28000,
            'additionalCharges' => 1200,
            'billsIncluded' => ['Water Supply'],
            'availability' => 'Available',
            'availableFrom' => '2026-11-01',
            'area' => 'Nirala R/A',
            'exactAddress' => 'Road 4, Plot 12, Nirala R/A, Khulna',
            'size' => 1100,
            'rooms' => 3,
            'bathrooms' => 2,
            'balconies' => 2,
            'floor' => '3rd Floor',
            'images' => [
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
            ],
            'publicContactVisible' => true,
        ];

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->postJson('/api/v1/landlord/properties', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('data.title', 'Brand New 3-Bed Flat in Nirala')
            ->assertJsonPath('data.approvalStatus', 'Pending Approval')
            ->assertJsonPath('data.area', 'Nirala R/A')
            ->assertJsonPath('data.lat', 22.8115) // Resolved from Option B area mapping
            ->assertJsonPath('data.lng', 89.5521);

        $this->assertDatabaseHas('properties', [
            'landlord_id' => $this->landlord->id,
            'title' => 'Brand New 3-Bed Flat in Nirala',
            'approval_status' => 'Pending Approval',
        ]);
    }

    /**
     * Test landlord cannot inject administrative approvalStatus on creation.
     */
    public function test_landlord_cannot_inject_approval_status_on_create(): void
    {
        $payload = [
            'title' => 'Attempt Escalation Property',
            'propertyType' => 'Apartment / Flat',
            'rentalType' => 'Monthly Rental',
            'rent' => 10000,
            'availableFrom' => '2026-11-01',
            'area' => 'Sonadanga R/A',
            'exactAddress' => 'Sonadanga Phase 1, Khulna',
            'size' => 800,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '1st',
            'images' => ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
            'approvalStatus' => 'Approved', // Injected
        ];

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->postJson('/api/v1/landlord/properties', $payload);

        // Status must remain 'Pending Approval'
        $res->assertStatus(201)
            ->assertJsonPath('data.approvalStatus', 'Pending Approval');
    }

    /**
     * Test editing approved property with material changes reverts status to 'Pending Approval'.
     */
    public function test_editing_approved_property_with_material_changes_reverts_to_pending(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Approved Property For Material Edit',
            'slug' => 'approved-material-edit-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 12000,
            'advance' => 24000,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 900,
            'rooms' => 2,
            'bathrooms' => 2,
            'floor' => '2nd',
        ]);

        // Material edit: change rent
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->putJson('/api/v1/landlord/properties/' . $property->id, [
                'rent' => 16000,
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.approvalStatus', 'Pending Approval')
            ->assertJsonPath('data.rent', 16000);

        $this->assertEquals('Pending Approval', $property->fresh()->approval_status);
    }

    /**
     * Test landlord cannot modify another landlord's property (IDOR protection).
     */
    public function test_landlord_cannot_modify_another_landlords_property(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Primary Landlord Property',
            'slug' => 'primary-landlord-prop-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 10000,
            'advance' => 20000,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 700,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '1st',
        ]);

        // Other landlord attempts update
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->otherToken)
            ->putJson('/api/v1/landlord/properties/' . $property->id, [
                'rent' => 99999,
            ]);

        $res->assertStatus(403);
    }

    /**
     * Test updating availability independently without losing approval status.
     */
    public function test_landlord_can_toggle_availability_independently(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Approved Listing For Availability Toggle',
            'slug' => 'approved-avail-toggle-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 10000,
            'advance' => 20000,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'approval_status' => 'Approved',
            'availability' => 'Available',
            'size' => 700,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => '1st',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->patchJson('/api/v1/landlord/properties/' . $property->id . '/availability', [
                'availability' => 'Reserved',
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.availability', 'Reserved')
            ->assertJsonPath('data.approvalStatus', 'Approved'); // Preserved!
    }

    /**
     * Test landlord can soft delete property.
     */
    public function test_landlord_can_soft_delete_property(): void
    {
        $property = Property::create([
            'landlord_id' => $this->landlord->id,
            'title' => 'Property To Delete',
            'slug' => 'property-to-delete-slug',
            'property_type' => 'Apartment / Flat',
            'rental_type' => 'Monthly Rental',
            'rent' => 8000,
            'advance' => 16000,
            'bills_included' => [],
            'available_from' => '2026-11-01',
            'approval_status' => 'Pending Approval',
            'availability' => 'Available',
            'size' => 600,
            'rooms' => 1,
            'bathrooms' => 1,
            'floor' => '2nd',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->landlordToken)
            ->deleteJson('/api/v1/landlord/properties/' . $property->id);

        $res->assertStatus(204);
        $this->assertSoftDeleted('properties', ['id' => $property->id]);
    }
}
