<?php

namespace Tests\Unit;

use RuntimeException;
use Tests\TestCase;

class DatabaseSafetyGuardTest extends TestCase
{
    public function test_safety_guard_allows_execution_when_database_is_thikana_test(): void
    {
        config(['database.connections.mysql.database' => 'thikana_test']);

        $this->assertSafeTestDatabase();
        $this->assertEquals('thikana_test', config('database.connections.mysql.database'));
    }

    public function test_safety_guard_aborts_when_database_is_development(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CRITICAL SAFETY VIOLATION');

        config(['database.connections.mysql.database' => 'thikana']);
        $this->assertSafeTestDatabase();
    }

    public function test_safety_guard_aborts_when_database_is_production(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CRITICAL SAFETY VIOLATION');

        config(['database.connections.mysql.database' => 'railway']);
        $this->assertSafeTestDatabase();
    }
}
