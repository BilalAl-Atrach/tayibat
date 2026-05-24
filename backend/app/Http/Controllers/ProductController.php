<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // ✅ Get all products
    public function index()
    {
        return response()->json(Product::all());
    }

    // ✅ Filter by category
    public function byCategory($category)
    {
        return response()->json(Product::where('category', $category)->get());
    }

    // ✅ Add new product
    public function store(Request $request)
    {
        $product = Product::create($request->all());
        return response()->json($product, 201);
    }
}
