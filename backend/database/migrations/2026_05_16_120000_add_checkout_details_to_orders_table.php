<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_number')->nullable()->after('id');
            $table->text('delivery_address')->nullable()->after('product_id');
            $table->unsignedInteger('quantity')->default(1)->after('delivery_address');
            $table->decimal('unit_price', 10, 2)->default(0)->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'order_number',
                'delivery_address',
                'quantity',
                'unit_price',
            ]);
        });
    }
};
