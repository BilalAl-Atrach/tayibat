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
    Schema::table('global_rules', function (Blueprint $table) {
        $table->string('recommended_portion')->nullable()->after('reason');
        $table->integer('max_servings')->nullable()->after('recommended_portion');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('global_rules', function (Blueprint $table) {
            //
        });
    }
};
