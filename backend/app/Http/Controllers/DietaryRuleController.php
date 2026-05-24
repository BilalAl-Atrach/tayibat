<?php

namespace App\Http\Controllers;

use App\Models\DietaryRule;
use App\Models\Condition;
use App\Models\Food;
use Illuminate\Http\Request;
use App\Models\GlobalRules;
use App\Models\Subscription;

class DietaryRuleController extends Controller
{
    // GET /api/rules/{condition}
    public function getRules(Request $request, $conditionName)
    {
        // Find condition by name
        $normalizedConditionName = strtolower(trim($conditionName));

        $condition = Condition::whereRaw('LOWER(name) = ?', [$normalizedConditionName])
            ->orWhereRaw('LOWER(name_ar) = ?', [$normalizedConditionName])
            ->first();

        if (!$condition) {
            return response()->json(['error' => 'Condition not found'], 404);
        }

        // Fetch condition‑specific rules
        $conditionRules = DietaryRule::where('condition_id', $condition->id)
            ->with('food:id,name,name_ar,meal_type,meal_role')
            ->get();

        // Fetch global rules (apply to all conditions)
        $globalRules = GlobalRules::with('food:id,name,name_ar,meal_type,meal_role')->get();

        // Merge both sets
        $allRules = $conditionRules->concat($globalRules);

        $user = $request->user('sanctum') ?: auth('sanctum')->user();
        $hasPremiumAccess = $user
            ? strtolower((string) $user->role) === 'admin'
                || Subscription::where('user_id', $user->id)
                ->where('plan', 'premium')
                ->where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->exists()
            : false;

        if (! $hasPremiumAccess) {
            $allowedAndModerate = $allRules
                ->filter(fn ($rule) => $rule->status !== 'avoid')
                ->take(5);

            $avoid = $allRules
                ->filter(fn ($rule) => $rule->status === 'avoid')
                ->take(5);

            $allRules = $allowedAndModerate->concat($avoid)->values();
        }

        return response()->json($allRules, 200);
    }

    public function lookupFoodRule(Request $request, $conditionName)
    {
        $request->validate([
            'food' => 'required|string',
        ]);

        $condition = Condition::whereRaw('LOWER(name) = ?', [strtolower(trim($conditionName))])
            ->orWhereRaw('LOWER(name_ar) = ?', [strtolower(trim($conditionName))])
            ->first();

        if (!$condition) {
            return response()->json(['message' => 'Condition not found.'], 404);
        }

        $foodText = $this->normalizeFoodText($request->query('food'));
        $foods = Food::all(['id', 'name', 'name_ar'])
            ->sortByDesc(fn ($food) => strlen((string) $food->name));

        $food = $foods->first(function ($food) use ($foodText) {
            $name = $this->normalizeFoodText($food->name);
            $nameAr = $this->normalizeFoodText($food->name_ar);

            return ($name && ($foodText === $name || str_contains(' ' . $foodText . ' ', ' ' . $name . ' ')))
                || ($nameAr && ($foodText === $nameAr || str_contains(' ' . $foodText . ' ', ' ' . $nameAr . ' ')));
        });

        if (!$food) {
            return response()->json(['exists' => false]);
        }

        $rule = DietaryRule::where('condition_id', $condition->id)
            ->where('food_id', $food->id)
            ->first();

        if (!$rule) {
            $rule = GlobalRules::where('food_id', $food->id)->first();
        }

        if (!$rule) {
            return response()->json([
                'exists' => false,
                'food' => [
                    'name' => $food->name,
                    'name_ar' => $food->name_ar,
                ],
            ]);
        }

        return response()->json([
            'exists' => true,
            'food' => [
                'name' => $food->name,
                'name_ar' => $food->name_ar,
            ],
            'status' => $rule->status,
            'reason' => $rule->reason,
            'reason_ar' => $rule->reason_ar ?? null,
            'max_servings' => $rule->max_servings ?? null,
        ]);
    }

    private function normalizeFoodText($value): string
    {
        return trim(preg_replace('/\s+/', ' ', mb_strtolower((string) $value)));
    }

}

