<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Safety Guard Hook: Called by RefreshDatabase before any migration, rollback, or transaction occurs.
     * Note: Signature intentionally omits return type to remain strictly compatible with RefreshDatabase trait.
     */
    protected function beforeRefreshingDatabase()
    {
        $this->assertSafeTestDatabase();
    }

    /**
     * Safety Guard Hook: Runs during setUp after application initialization.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSafeTestDatabase();
    }

    /**
     * Assert that the active database connection is strictly thikana_test.
     * Throws a RuntimeException immediately if pointing to development or production.
     */
    protected function assertSafeTestDatabase(): void
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if ($database !== 'thikana_test') {
            throw new RuntimeException(
                "CRITICAL SAFETY VIOLATION: Test suite attempted to execute against database '{$database}' on connection '{$connection}'. " .
                "Tests may ONLY execute against dedicated test database 'thikana_test'. Execution terminated to protect data integrity."
            );
        }
    }
}
