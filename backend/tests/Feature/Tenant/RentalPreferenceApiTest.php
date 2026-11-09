<?php

namespace Tests\Feature\Tenant;

use App\Http\Requests\RentalPreferenceRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class RentalPreferenceApiTest extends TestCase
{
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/tenant/preferences')->assertUnauthorized();
        $this->putJson('/api/v1/tenant/preferences', [])->assertUnauthorized();
        $this->deleteJson('/api/v1/tenant/preferences')->assertUnauthorized();
    }

    public function test_landlord_cannot_access_tenant_preferences(): void
    {
        $landlordRole = new Role(['id' => 2, 'name' => 'Landlord', 'slug' => 'landlord']);
        $landlord = new User(['id' => 99, 'name' => 'Landlord User', 'status' => 'active']);
        $landlord->setRelation('role', $landlordRole);

        $this->actingAs($landlord)
            ->getJson('/api/v1/tenant/preferences')
            ->assertForbidden();

        $this->actingAs($landlord)
            ->putJson('/api/v1/tenant/preferences', ['max_budget' => 10000])
            ->assertForbidden();

        $this->actingAs($landlord)
            ->deleteJson('/api/v1/tenant/preferences')
            ->assertForbidden();
    }

    public function test_admin_cannot_access_tenant_preferences(): void
    {
        $adminRole = new Role(['id' => 3, 'name' => 'Admin', 'slug' => 'admin']);
        $admin = new User(['id' => 98, 'name' => 'Admin User', 'status' => 'active']);
        $admin->setRelation('role', $adminRole);

        $this->actingAs($admin)
            ->getJson('/api/v1/tenant/preferences')
            ->assertForbidden();
    }

    public function test_rental_preference_validation_rules(): void
    {
        $rules = (new RentalPreferenceRequest())->rules();

        // Positive budget test
        $v1 = Validator::make(['max_budget' => -500], $rules);
        $this->assertTrue($v1->fails());
        $this->assertArrayHasKey('max_budget', $v1->errors()->toArray());

        $vZero = Validator::make(['max_budget' => 0], $rules);
        $this->assertTrue($vZero->fails());

        $vPositive = Validator::make(['max_budget' => 12000], $rules);
        $this->assertFalse($vPositive->errors()->has('max_budget'));

        // Min rooms test
        $vRooms = Validator::make(['min_rooms' => 0], $rules);
        $this->assertTrue($vRooms->fails());
        $this->assertArrayHasKey('min_rooms', $vRooms->errors()->toArray());

        // Min bathrooms test
        $vBaths = Validator::make(['min_bathrooms' => 0], $rules);
        $this->assertTrue($vBaths->fails());
        $this->assertArrayHasKey('min_bathrooms', $vBaths->errors()->toArray());
    }
}

