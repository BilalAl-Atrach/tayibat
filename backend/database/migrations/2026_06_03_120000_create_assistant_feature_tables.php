<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_nutrition_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('allergies')->nullable();
            $table->json('disliked_foods')->nullable();
            $table->json('preferred_foods')->nullable();
            $table->string('meal_count_preference')->nullable();
            $table->unsignedTinyInteger('fasting_days_per_week')->default(2);
            $table->string('budget_level')->nullable();
            $table->string('language_preference', 5)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('user_food_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('condition_id')->nullable()->constrained('conditions')->nullOnDelete();
            $table->string('food_name');
            $table->string('meal_type')->nullable();
            $table->timestamp('logged_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('saved_diet_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('condition_id')->nullable()->constrained('conditions')->nullOnDelete();
            $table->string('duration');
            $table->json('plan');
            $table->timestamps();
        });

        Schema::create('user_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->string('frequency')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_reminders');
        Schema::dropIfExists('saved_diet_plans');
        Schema::dropIfExists('user_food_logs');
        Schema::dropIfExists('user_nutrition_profiles');
    }
};
