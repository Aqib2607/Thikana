<?php

namespace Database\Seeders;

use RuntimeException;

class DemoSeedingGuard
{
    /**
     * Strictly approved loopback development hosts for MySQL.
     * Rejects arbitrary service names ('mysql'), public IPs, and non-loopback private networks.
     *
     * @var array<int, string>
     */
    public const ALLOWED_LOCAL_HOSTS = [
        '127.0.0.1',
        'localhost',
        '::1',
    ];

    /**
     * Enforce strict environment and database host safety before any demo records can be seeded.
     *
     * @throws RuntimeException
     */
    public static function assertSafeEnvironment(): void
    {
        // 1. Environment Guard (Reject production and staging)
        if (app()->environment('production', 'staging')) {
            throw new RuntimeException(
                'CRITICAL SAFETY VIOLATION: Demo database seeding is strictly prohibited in production and staging environments.'
            );
        }

        // 2. Resolve Active Database Connection
        $defaultConnection = config('database.default');
        if (! is_string($defaultConnection) || $defaultConnection === '') {
            throw new RuntimeException(
                'CRITICAL SAFETY VIOLATION: Default database connection is undefined or invalid. Refusing to seed.'
            );
        }

        $connectionConfig = config("database.connections.{$defaultConnection}");
        if (! is_array($connectionConfig)) {
            throw new RuntimeException(
                "CRITICAL SAFETY VIOLATION: Configuration for database connection '{$defaultConnection}' could not be resolved."
            );
        }

        // 3. Driver Verification (Must be mysql)
        $driver = $connectionConfig['driver'] ?? null;
        if ($driver !== 'mysql') {
            $sanitizedDriver = is_string($driver) ? $driver : 'unknown';
            throw new RuntimeException(
                "CRITICAL SAFETY VIOLATION: Demo database seeding requires the 'mysql' driver. Configured driver '{$sanitizedDriver}' is unsupported."
            );
        }

        // 4. Host Verification (Fail closed if host is missing, empty, or not in approved loopback allowlist)
        $host = $connectionConfig['host'] ?? null;
        if (! is_string($host) || trim($host) === '') {
            throw new RuntimeException(
                'CRITICAL SAFETY VIOLATION: Database host is missing or ambiguous. Refusing to seed.'
            );
        }

        $normalizedHost = strtolower(trim($host));

        if (! in_array($normalizedHost, self::ALLOWED_LOCAL_HOSTS, true)) {
            throw new RuntimeException(
                "CRITICAL SAFETY VIOLATION: Demo database seeding rejected remote or unauthorized database host '{$normalizedHost}'. Only approved local hosts are permitted."
            );
        }
    }
}
