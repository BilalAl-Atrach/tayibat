<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::create('global_rules', function (Blueprint $table) {
        $table->id();
        $table->foreignId('food_id')->constrained('foods')->onDelete('cascade');
        $table->enum('status', ['allowed','moderate','avoid']);
        $table->text('reason')->nullable();
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('global_rules');
    }
};
