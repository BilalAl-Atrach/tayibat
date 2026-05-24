<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            }

            if (!Schema::hasColumn('subscriptions', 'plan')) {
                $table->string('plan')->default('premium')->after('user_id');
            }

            if (!Schema::hasColumn('subscriptions', 'status')) {
                $table->string('status')->default('active')->after('plan');
            }

            if (!Schema::hasColumn('subscriptions', 'price')) {
                $table->decimal('price', 10, 2)->default(15)->after('status');
            }

            if (!Schema::hasColumn('subscriptions', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('price');
            }

            if (!Schema::hasColumn('subscriptions', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('started_at');
            }
        });

        Schema::create('user_guidance_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('ai_questions_used')->default(0);
            $table->timestamps();
        });

        Schema::create('diet_plan_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('duration');
            $table->decimal('price', 10, 2);
            $table->string('status')->default('active');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'duration']);
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('diet_plan_duration')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('status')->default('pending');
            $table->string('provider')->default('whish');
            $table->string('provider_reference')->nullable()->index();
            $table->text('checkout_url')->nullable();
            $table->json('provider_payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('diet_plan_purchases');
        Schema::dropIfExists('user_guidance_usages');

        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }

            foreach (['expires_at', 'started_at', 'price', 'status', 'plan'] as $column) {
                if (Schema::hasColumn('subscriptions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
