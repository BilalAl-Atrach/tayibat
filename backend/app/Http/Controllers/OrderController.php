<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'products' => 'required|array|min:1',
            'products.*' => 'required|integer|exists:products,id',
        ]);

        $userId = $request->user()->id;
        $orders = [];

        foreach ($request->products as $productId) {
            $orders[] = Order::create([
                'user_id' => $userId,
                'product_id' => $productId,
                'order_date' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Order placed successfully',
            'orders' => $orders,
        ], 201);
    }

    public function index()
    {
        return response()->json(Order::with(['user', 'product'])->latest()->get());
    }
}
