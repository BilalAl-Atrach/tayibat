<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guidance_chat_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('condition_id')->constrained()->cascadeOnDelete();
            $table->json('messages');
            $table->timestamps();

            $table->unique(['user_id', 'condition_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guidance_chat_histories');
    }
};
