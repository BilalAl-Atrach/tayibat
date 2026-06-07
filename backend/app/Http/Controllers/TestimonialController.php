<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TestimonialController extends Controller
{
    public function index()
    {
        return response()->json(
            Cache::remember('testimonials:v1', now()->addMinutes(10), fn () => Testimonial::all())
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'quote' => 'required|string',
            'image' => 'nullable|string|max:2048',
        ]);

        $testimonial = Testimonial::create($validated);
        Cache::forget('testimonials:v1');

        return response()->json($testimonial, 201);
    }
}
