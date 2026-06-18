<?php

namespace App\Http\Controllers;

use App\Models\Condition;
use App\Models\DietaryRule;
use App\Models\Food;
use App\Models\GlobalRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AdminNutritionController extends Controller
{
    public function foods()
    {
        return response()->json(Food::orderBy('name')->get());
    }

    public function storeFood(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:foods,name',
            'name_ar' => 'nullable|string|max:255',
            'meal_type' => ['nullable', Rule::in(['breakfast', 'lunch', 'dinner', 'snack', 'any'])],
            'meal_role' => ['nullable', Rule::in(['main', 'side', 'drink', 'fat', 'fruit', 'snack', 'solo', 'any'])],
        ]);

        $food = Food::create($validated);
        $this->clearNutritionCaches();

        return response()->json($food, 201);
    }

    public function updateFood(Request $request, Food $food)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('foods', 'name')->ignore($food->id)],
            'name_ar' => 'nullable|string|max:255',
            'meal_type' => ['nullable', Rule::in(['breakfast', 'lunch', 'dinner', 'snack', 'any'])],
            'meal_role' => ['nullable', Rule::in(['main', 'side', 'drink', 'fat', 'fruit', 'snack', 'solo', 'any'])],
        ]);

        $food->update($validated);
        $this->clearNutritionCaches();

        return response()->json($food);
    }

    public function deleteFood(Food $food)
    {
        $food->delete();
        $this->clearNutritionCaches();

        return response()->json(['message' => 'Food deleted successfully.']);
    }

    public function conditions()
    {
        return response()->json(Condition::orderBy('name')->get());
    }

    public function storeCondition(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:conditions,name',
            'name_ar' => 'nullable|string|max:255',
        ]);

        $condition = Condition::create($validated);
        $this->clearNutritionCaches();

        return response()->json($condition, 201);
    }

    public function updateCondition(Request $request, Condition $condition)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('conditions', 'name')->ignore($condition->id)],
            'name_ar' => 'nullable|string|max:255',
        ]);

        $condition->update($validated);
        $this->clearNutritionCaches();

        return response()->json($condition);
    }

    public function deleteCondition(Condition $condition)
    {
        $condition->delete();
        $this->clearNutritionCaches();

        return response()->json(['message' => 'Condition deleted successfully.']);
    }

    public function dietaryRules()
    {
        return response()->json(
            DietaryRule::with(['food:id,name,name_ar,meal_type,meal_role', 'condition:id,name,name_ar'])
                ->latest()
                ->get()
        );
    }

    public function storeDietaryRule(Request $request)
    {
        $validated = $this->validateDietaryRule($request);

        $rule = DietaryRule::updateOrCreate(
            [
                'food_id' => $validated['food_id'],
                'condition_id' => $validated['condition_id'],
            ],
            $validated
        );
        $this->clearNutritionCaches($rule->condition_id);

        return response()->json($rule->load(['food:id,name,name_ar,meal_type,meal_role', 'condition:id,name,name_ar']), 201);
    }

    public function updateDietaryRule(Request $request, DietaryRule $dietaryRule)
    {
        $validated = $this->validateDietaryRule($request);

        $dietaryRule->update($validated);
        $this->clearNutritionCaches($dietaryRule->condition_id);

        return response()->json($dietaryRule->load(['food:id,name,name_ar,meal_type,meal_role', 'condition:id,name,name_ar']));
    }

    public function deleteDietaryRule(DietaryRule $dietaryRule)
    {
        $dietaryRule->delete();
        $this->clearNutritionCaches($dietaryRule->condition_id);

        return response()->json(['message' => 'Dietary rule deleted successfully.']);
    }

    public function globalRules()
    {
        return response()->json(
            GlobalRules::with('food:id,name,name_ar,meal_type,meal_role')
                ->latest()
                ->get()
        );
    }

    public function storeGlobalRule(Request $request)
    {
        $validated = $this->validateGlobalRule($request);

        $rule = GlobalRules::updateOrCreate(
            ['food_id' => $validated['food_id']],
            $validated
        );
        $this->clearNutritionCaches();

        return response()->json($rule->load('food:id,name,name_ar,meal_type,meal_role'), 201);
    }

    public function updateGlobalRule(Request $request, GlobalRules $globalRule)
    {
        $validated = $this->validateGlobalRule($request);

        $globalRule->update($validated);
        $this->clearNutritionCaches();

        return response()->json($globalRule->load('food:id,name,name_ar,meal_type,meal_role'));
    }

    public function deleteGlobalRule(GlobalRules $globalRule)
    {
        $globalRule->delete();
        $this->clearNutritionCaches();

        return response()->json(['message' => 'Global rule deleted successfully.']);
    }

    private function validateDietaryRule(Request $request): array
    {
        return $request->validate([
            'condition_id' => 'required|exists:conditions,id',
            'food_id' => 'required|exists:foods,id',
            'status' => ['required', Rule::in(['allowed', 'moderate', 'avoid'])],
            'reason' => 'nullable|string',
            'reason_ar' => 'nullable|string',
            'max_servings' => 'nullable|string|max:255',
        ]);
    }

    private function validateGlobalRule(Request $request): array
    {
        return $request->validate([
            'food_id' => 'required|exists:foods,id',
            'status' => ['required', Rule::in(['allowed', 'moderate', 'avoid'])],
            'reason' => 'nullable|string',
            'reason_ar' => 'nullable|string',
        ]);
    }

    private function clearNutritionCaches(?int $conditionId = null): void
    {
        Cache::forget('conditions:v1');
        Cache::forget('foods:lookup:v1');

        $conditionIds = $conditionId
            ? [$conditionId]
            : Condition::query()->pluck('id')->all();

        foreach ($conditionIds as $id) {
            Cache::forget('rules:v2:' . $id . ':free');
            Cache::forget('rules:v2:' . $id . ':premium');
            Cache::forget('diet-plan-rules:v1:' . $id);
        }
    }
}
