<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fortify's two-factor columns on `users`, for `->login(twoFactor: ...)` and the `InteractsWithTwoFactor` trait; each
 * is skipped when it is already there (an app that used Fortify keeps its enrolments). Change the table name if your
 * staff live elsewhere.
 */
return new class extends Migration
{
    private const string TABLE = 'users';

    public function up(): void
    {
        Schema::table(self::TABLE, function (Blueprint $table): void {
            if (! Schema::hasColumn(self::TABLE, 'two_factor_secret')) {
                $table->text('two_factor_secret')->nullable();
            }

            if (! Schema::hasColumn(self::TABLE, 'two_factor_recovery_codes')) {
                $table->text('two_factor_recovery_codes')->nullable();
            }

            if (! Schema::hasColumn(self::TABLE, 'two_factor_confirmed_at')) {
                $table->timestamp('two_factor_confirmed_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table(self::TABLE, function (Blueprint $table): void {
            $table->dropColumn(array_values(array_filter(
                ['two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at'],
                fn (string $column): bool => Schema::hasColumn(self::TABLE, $column),
            )));
        });
    }
};
