<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index()
    {
        return response()->json(Testimonial::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'quote' => 'required|string',
            'image' => 'nullable|string|max:2048',
        ]);

        $testimonial = Testimonial::create($validated);

        return response()->json($testimonial, 201);
    }
}
