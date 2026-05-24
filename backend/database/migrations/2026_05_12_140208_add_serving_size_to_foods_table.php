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
    Schema::table('foods', function (Blueprint $table) {
        $table->string('serving_size')->nullable(); // e.g. "100g", "1 cup"
    });
}

public function down()
{
    Schema::table('foods', function (Blueprint $table) {
        $table->dropColumn('serving_size');
    });
}

};
