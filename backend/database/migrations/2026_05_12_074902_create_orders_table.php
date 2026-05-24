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
    Schema::create('orders', function (Blueprint $table) {
        $table->id(); // this will be your order_id
        $table->unsignedBigInteger('user_id');
        $table->unsignedBigInteger('product_id');
        $table->timestamp('order_date')->useCurrent(); // automatically stores current date/time
        $table->timestamps();

        // ✅ Foreign keys
        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
    });
}

public function down()
{
    Schema::dropIfExists('orders');
}

};
