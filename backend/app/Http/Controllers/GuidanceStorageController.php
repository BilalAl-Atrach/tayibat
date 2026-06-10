<?php

namespace App\Http\Controllers;

use App\Models\Condition;
use App\Models\DietPlanPurchase;
use App\Models\GuidanceChatHistory;
use Illuminate\Http\Request;

class GuidanceStorageController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'condition_id' => ['required', 'integer', 'exists:conditions,id'],
        ]);

        $history = GuidanceChatHistory::where('user_id', $request->user()->id)
            ->where('condition_id', $validated['condition_id'])
            ->first();

        return response()->json([
            'condition_id' => $validated['condition_id'],
            'messages' => $history?->messages ?? [],
        ]);
    }

    public function saveChat(Request $request)
    {
        $validated = $request->validate([
            'condition_id' => ['required', 'integer', 'exists:conditions,id'],
            'messages' => ['required', 'array', 'max:100'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.text' => ['required', 'string', 'max:4000'],
        ]);

        $messages = array_slice($validated['messages'], -100);

        GuidanceChatHistory::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'condition_id' => $validated['condition_id'],
            ],
            ['messages' => $messages]
        );

        return response()->json([
            'condition_id' => $validated['condition_id'],
            'messages' => $messages,
        ]);
    }

    public function savedDietPlan(Request $request)
    {
        $validated = $request->validate([
            'condition_id' => ['required', 'integer', 'exists:conditions,id'],
            'duration' => ['nullable', 'string'],
        ]);

        $query = DietPlanPurchase::where('user_id', $request->user()->id)
            ->where('condition_id', $validated['condition_id'])
            ->where('status', 'active')
            ->whereNotNull('generated_plan')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        if (! empty($validated['duration'])) {
            $query->where('duration', $validated['duration']);
        }

        $purchase = $query
            ->latest('generated_at')
            ->latest('id')
            ->first();

        if (! $purchase) {
            return response()->json([
                'diet_plan' => null,
            ]);
        }

        $condition = Condition::find($validated['condition_id']);
        $savedPlan = $purchase->generated_plan ?? [];

        return response()->json([
            'diet_plan' => [
                'condition' => $savedPlan['condition'] ?? $condition?->name,
                'condition_ar' => $savedPlan['condition_ar'] ?? $condition?->name_ar,
                'duration' => $savedPlan['duration'] ?? $purchase->duration,
                'days' => $savedPlan['days'] ?? null,
                'message' => 'Your saved diet plan is ready.',
                'plan' => $savedPlan['plan'] ?? [],
                'generated_at' => $purchase->generated_at,
                'expires_at' => $purchase->expires_at,
                'from_saved_plan' => true,
            ],
        ]);
    }
}
