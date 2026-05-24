<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'condition')) {
                $table->string('condition')->nullable()->default(null)->change();
            } else {
                $table->string('condition')->nullable()->default(null)->after('password');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'condition')) {
                $table->string('condition')->default('restricted_diet')->change();
            }
        });
    }
};
