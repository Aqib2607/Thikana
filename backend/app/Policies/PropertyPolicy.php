<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    /**
     * Determine whether the user can view any properties.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific property.
     */
    public function view(?User $user, Property $property): bool
    {
        if ($property->isApproved()) {
            return true;
        }

        if ($user === null) {
            return false;
        }

        return $user->hasRole('admin') || $user->id === $property->landlord_id;
    }

    /**
     * Determine whether the user can create properties.
     */
    public function create(User $user): bool
    {
        return $user->isActive() && ($user->hasRole('landlord') || $user->hasRole('admin'));
    }

    /**
     * Determine whether the user can update the property.
     */
    public function update(User $user, Property $property): bool
    {
        if (!$user->isActive()) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('landlord') && $user->id === $property->landlord_id;
    }

    /**
     * Determine whether the user can delete the property.
     */
    public function delete(User $user, Property $property): bool
    {
        if (!$user->isActive()) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('landlord') && $user->id === $property->landlord_id;
    }
}

