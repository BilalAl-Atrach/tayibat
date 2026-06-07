<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diet_plan_purchases', function (Blueprint $table) {
            if (! Schema::hasColumn('diet_plan_purchases', 'generated_plan')) {
                $table->json('generated_plan')->nullable()->after('paid_at');
            }

            if (! Schema::hasColumn('diet_plan_purchases', 'generated_at')) {
                $table->timestamp('generated_at')->nullable()->after('generated_plan');
            }

            if (! Schema::hasColumn('diet_plan_purchases', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('generated_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('diet_plan_purchases', function (Blueprint $table) {
            foreach (['expires_at', 'generated_at', 'generated_plan'] as $column) {
                if (Schema::hasColumn('diet_plan_purchases', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
