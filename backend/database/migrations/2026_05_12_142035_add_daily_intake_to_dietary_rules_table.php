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
    Schema::table('dietary_rules', function (Blueprint $table) {
        $table->string('recommended_portion')->nullable(); // e.g. "1 cup per meal"
        $table->string('max_servings')->nullable();        // e.g. "2 servings/day"
    });
}

public function down()
{
    Schema::table('dietary_rules', function (Blueprint $table) {
        $table->dropColumn(['recommended_portion', 'max_servings']);
    });
}

};
