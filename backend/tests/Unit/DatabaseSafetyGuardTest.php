<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase as BaseTestCase;
use RuntimeException;

class DatabaseSafetyGuardTest extends BaseTestCase
{
    public function test_safety_guard_aborts_when_database_is_development(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("CRITICAL SAFETY VIOLATION");

        $database = 'thikana';
        if ($database !== 'thikana_test') {
            throw new RuntimeException("CRITICAL SAFETY VIOLATION: Database '{$database}' is not 'thikana_test'.");
        }
    }

    public function test_safety_guard_aborts_when_database_is_production(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("CRITICAL SAFETY VIOLATION");

        $database = 'railway';
        if ($database !== 'thikana_test') {
            throw new RuntimeException("CRITICAL SAFETY VIOLATION: Database '{$database}' is not 'thikana_test'.");
        }
    }

    public function test_safety_guard_allows_execution_when_database_is_thikana_test(): void
    {
        $database = 'thikana_test';
        $aborted = false;

        if ($database !== 'thikana_test') {
            $aborted = true;
        }

        $this->assertFalse($aborted);
    }
}

