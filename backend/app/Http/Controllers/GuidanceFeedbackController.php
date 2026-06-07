<?php

namespace App\Http\Controllers;

use App\Models\Condition;
use App\Models\GuidanceFeedback;
use Illuminate\Http\Request;

class GuidanceFeedbackController extends Controller
{
    public function index()
    {
        return response()->json(
            GuidanceFeedback::with(['user', 'condition'])->latest()->limit(200)->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'condition_id' => 'required|integer|exists:conditions,id',
            'rating' => 'nullable|integer|min:1|max:5',
            'message' => 'required|string|min:3|max:5000',
        ]);

        $condition = Condition::findOrFail($validated['condition_id']);

        $feedback = GuidanceFeedback::create([
            'user_id' => $request->user()->id,
            'condition_id' => $condition->id,
            'condition_name' => $condition->name,
            'rating' => $validated['rating'] ?? null,
            'message' => $validated['message'],
        ]);

        return response()->json([
            'message' => 'Thank you. Your feedback was submitted successfully.',
            'feedback' => $feedback->load(['user', 'condition']),
        ], 201);
    }
}
