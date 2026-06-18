<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_webhook_logs', function (Blueprint $table) {
            // Add unique constraint on provider + provider_reference for idempotency
            // This ensures duplicate webhooks from the payment provider won't create duplicate entries
            $table->unique(['provider', 'provider_reference']);
        });
    }

    public function down(): void
    {
        Schema::table('payment_webhook_logs', function (Blueprint $table) {
            $table->dropUnique(['provider', 'provider_reference']);
        });
    }
};
