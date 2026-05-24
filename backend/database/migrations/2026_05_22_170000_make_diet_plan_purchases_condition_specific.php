<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diet_plan_purchases', function (Blueprint $table) {
            if (Schema::hasColumn('diet_plan_purchases', 'user_id') && Schema::hasColumn('diet_plan_purchases', 'duration')) {
                $table->dropForeign(['user_id']);
                $table->dropUnique('diet_plan_purchases_user_id_duration_unique');
            }

            if (!Schema::hasColumn('diet_plan_purchases', 'condition_id')) {
                $table->foreignId('condition_id')->nullable()->after('user_id')->constrained('conditions')->nullOnDelete();
            }

            $table->unique(['user_id', 'condition_id', 'duration'], 'diet_plan_user_condition_duration_unique');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('payment_transactions', 'condition_id')) {
                $table->foreignId('condition_id')->nullable()->after('diet_plan_duration')->constrained('conditions')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('payment_transactions', 'condition_id')) {
                $table->dropConstrainedForeignId('condition_id');
            }
        });

        Schema::table('diet_plan_purchases', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('diet_plan_user_condition_duration_unique');

            if (Schema::hasColumn('diet_plan_purchases', 'condition_id')) {
                $table->dropConstrainedForeignId('condition_id');
            }

            $table->unique(['user_id', 'duration']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
