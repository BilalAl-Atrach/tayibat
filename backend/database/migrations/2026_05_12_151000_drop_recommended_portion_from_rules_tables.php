<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dietary_rules', function (Blueprint $table) {
            if (Schema::hasColumn('dietary_rules', 'recommended_portion')) {
                $table->dropColumn('recommended_portion');
            }
        });

        Schema::table('global_rules', function (Blueprint $table) {
            if (Schema::hasColumn('global_rules', 'recommended_portion')) {
                $table->dropColumn('recommended_portion');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dietary_rules', function (Blueprint $table) {
            if (! Schema::hasColumn('dietary_rules', 'recommended_portion')) {
                $table->string('recommended_portion')->nullable()->after('reason');
            }
        });

        Schema::table('global_rules', function (Blueprint $table) {
            if (! Schema::hasColumn('global_rules', 'recommended_portion')) {
                $table->string('recommended_portion')->nullable()->after('reason');
            }
        });
    }
};
