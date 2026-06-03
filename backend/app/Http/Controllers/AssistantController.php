<?php

namespace App\Http\Controllers;

use App\Models\Condition;
use App\Models\DietaryRule;
use App\Models\GlobalRules;
use App\Models\SavedDietPlan;
use App\Models\UserFoodLog;
use App\Models\UserNutritionProfile;
use App\Models\UserReminder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class AssistantController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'profile' => $this->profileFor($user->id),
            'recent_logs' => UserFoodLog::where('user_id', $user->id)
                ->latest('logged_at')
                ->latest()
                ->limit(8)
                ->get(),
            'saved_plans' => SavedDietPlan::where('user_id', $user->id)
                ->with('condition:id,name,name_ar')
                ->latest()
                ->limit(5)
                ->get(),
            'reminders' => $this->remindersFor($user->id),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'allergies' => 'nullable|array',
            'allergies.*' => 'string|max:120',
            'disliked_foods' => 'nullable|array',
            'disliked_foods.*' => 'string|max:120',
            'preferred_foods' => 'nullable|array',
            'preferred_foods.*' => 'string|max:120',
            'meal_count_preference' => 'nullable|string|max:80',
            'fasting_days_per_week' => 'nullable|integer|min:0|max:7',
            'budget_level' => 'nullable|string|max:40',
            'language_preference' => 'nullable|in:en,ar',
            'notes' => 'nullable|string|max:1000',
        ]);

        $profile = UserNutritionProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'allergies' => $this->cleanList($validated['allergies'] ?? []),
                'disliked_foods' => $this->cleanList($validated['disliked_foods'] ?? []),
                'preferred_foods' => $this->cleanList($validated['preferred_foods'] ?? []),
                'meal_count_preference' => $validated['meal_count_preference'] ?? null,
                'fasting_days_per_week' => $validated['fasting_days_per_week'] ?? 2,
                'budget_level' => $validated['budget_level'] ?? null,
                'language_preference' => $validated['language_preference'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        $this->syncDefaultReminders($request->user()->id, $profile);

        return response()->json([
            'message' => 'Nutrition profile saved.',
            'profile' => $profile,
            'reminders' => $this->remindersFor($request->user()->id),
        ]);
    }

    public function storeFoodLog(Request $request)
    {
        $validated = $request->validate([
            'condition_id' => 'nullable|integer|exists:conditions,id',
            'food_name' => 'required|string|max:180',
            'meal_type' => 'nullable|string|max:50',
            'logged_at' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $log = UserFoodLog::create([
            'user_id' => $request->user()->id,
            'condition_id' => $validated['condition_id'] ?? null,
            'food_name' => $validated['food_name'],
            'meal_type' => $validated['meal_type'] ?? null,
            'logged_at' => $validated['logged_at'] ?? now(),
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Food logged.',
            'log' => $log,
        ], 201);
    }

    public function savePlan(Request $request)
    {
        $validated = $request->validate([
            'condition_id' => 'nullable|integer|exists:conditions,id',
            'duration' => 'required|string|max:40',
            'plan' => 'required|array',
        ]);

        $savedPlan = SavedDietPlan::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'condition_id' => $validated['condition_id'] ?? null,
                'duration' => $validated['duration'],
            ],
            ['plan' => $validated['plan']]
        );

        return response()->json([
            'message' => 'Diet plan saved.',
            'saved_plan' => $savedPlan,
        ]);
    }

    public function editPlan(Request $request)
    {
        $validated = $request->validate([
            'condition_id' => 'required|integer|exists:conditions,id',
            'duration' => 'required|string|max:40',
            'plan' => 'required|array',
            'action' => 'required|string|in:replace_food,remove_food,no_breakfast,make_cheaper',
            'food' => 'nullable|string|max:180',
            'replacement' => 'nullable|string|max:180',
        ]);

        $plan = $validated['plan'];
        $message = match ($validated['action']) {
            'replace_food' => $this->replaceFood($plan, $validated['condition_id'], $validated['food'] ?? '', $validated['replacement'] ?? null),
            'remove_food' => $this->removeFood($plan, $validated['food'] ?? ''),
            'no_breakfast' => $this->removeMealType($plan, 'Breakfast'),
            'make_cheaper' => $this->makeCheaper($plan, $validated['condition_id']),
        };

        $savedPlan = SavedDietPlan::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'condition_id' => $validated['condition_id'],
                'duration' => $validated['duration'],
            ],
            ['plan' => $plan]
        );

        return response()->json([
            'message' => $message,
            'plan' => $plan,
            'saved_plan' => $savedPlan,
        ]);
    }

    public function shoppingList(Request $request)
    {
        $validated = $request->validate([
            'plan' => 'required|array',
        ]);

        $foods = collect($validated['plan']['plan'] ?? [])
            ->flatMap(fn ($day) => $day['meals'] ?? [])
            ->flatMap(function ($meal) {
                if (! empty($meal['foods']) && is_array($meal['foods'])) {
                    return collect($meal['foods'])->pluck('name');
                }

                return preg_split('/\s+\+\s+/', (string) ($meal['food'] ?? '')) ?: [];
            })
            ->map(fn ($food) => trim((string) $food))
            ->filter()
            ->unique(fn ($food) => strtolower($food))
            ->values();

        return response()->json([
            'shopping_list' => [
                'proteins' => $this->matchingFoods($foods, ['chicken', 'beef', 'fish', 'egg', 'meat', 'tuna', 'kabab']),
                'vegetables' => $this->matchingFoods($foods, ['salad', 'lettuce', 'tomato', 'cucumber', 'broccoli', 'vegetable', 'zucchini']),
                'drinks' => $this->matchingFoods($foods, ['tea', 'water', 'drink', 'juice']),
                'fats' => $this->matchingFoods($foods, ['olive oil', 'avocado', 'olives', 'nuts']),
                'grains_and_sides' => $this->matchingFoods($foods, ['rice', 'toast', 'bread', 'pasta', 'potato']),
                'other' => $foods->reject(fn ($food) => $this->belongsToAnyShoppingGroup($food))->values(),
            ],
        ]);
    }

    public function updateReminder(Request $request, UserReminder $reminder)
    {
        abort_unless($reminder->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $reminder->update(['enabled' => $validated['enabled']]);

        return response()->json([
            'message' => 'Reminder updated.',
            'reminder' => $reminder,
        ]);
    }

    private function profileFor(int $userId): UserNutritionProfile
    {
        $profile = UserNutritionProfile::firstOrCreate(
            ['user_id' => $userId],
            [
                'allergies' => [],
                'disliked_foods' => [],
                'preferred_foods' => [],
                'fasting_days_per_week' => 2,
            ]
        );

        $this->syncDefaultReminders($userId, $profile);

        return $profile;
    }

    private function remindersFor(int $userId)
    {
        return UserReminder::where('user_id', $userId)->orderBy('id')->get();
    }

    private function syncDefaultReminders(int $userId, UserNutritionProfile $profile): void
    {
        $defaults = [
            ['type' => 'fasting', 'title' => 'Try to fast ' . ($profile->fasting_days_per_week ?: 2) . ' days a week.', 'frequency' => 'weekly'],
            ['type' => 'training', 'title' => 'Train 5 days a week for 30-45 minutes.', 'frequency' => 'weekly'],
            ['type' => 'hunger', 'title' => 'Eat only when you feel hungry.', 'frequency' => 'daily'],
            ['type' => 'thirst', 'title' => 'Drink only when you feel thirsty.', 'frequency' => 'daily'],
        ];

        foreach ($defaults as $reminder) {
            UserReminder::updateOrCreate(
                ['user_id' => $userId, 'type' => $reminder['type']],
                Arr::only($reminder, ['title', 'frequency'])
            );
        }
    }

    private function cleanList(array $items): array
    {
        return collect($items)
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique(fn ($item) => strtolower($item))
            ->values()
            ->all();
    }

    private function replaceFood(array &$plan, int $conditionId, string $food, ?string $replacement): string
    {
        if (! trim($food)) {
            return 'Choose a food to replace.';
        }

        $replacement = $replacement ?: $this->firstAllowedFood($conditionId, $food);

        if (! $replacement) {
            return 'No replacement food is available from the allowed rules.';
        }

        foreach ($plan['plan'] ?? [] as &$day) {
            foreach ($day['meals'] ?? [] as &$meal) {
                if (stripos((string) ($meal['food'] ?? ''), $food) !== false) {
                    $meal['food'] = str_ireplace($food, $replacement, (string) $meal['food']);
                    $meal['food_ar'] = $meal['food_ar'] ?? $meal['food'];
                }
            }
        }

        return "Replaced {$food} with {$replacement}.";
    }

    private function removeFood(array &$plan, string $food): string
    {
        if (! trim($food)) {
            return 'Choose a food to remove.';
        }

        foreach ($plan['plan'] ?? [] as &$day) {
            $day['meals'] = collect($day['meals'] ?? [])
                ->reject(fn ($meal) => stripos((string) ($meal['food'] ?? ''), $food) !== false)
                ->values()
                ->all();
        }

        return "Removed meals containing {$food}.";
    }

    private function removeMealType(array &$plan, string $mealName): string
    {
        foreach ($plan['plan'] ?? [] as &$day) {
            $day['meals'] = collect($day['meals'] ?? [])
                ->reject(fn ($meal) => strcasecmp((string) ($meal['meal'] ?? ''), $mealName) === 0)
                ->values()
                ->all();
        }

        return "{$mealName} removed from this plan.";
    }

    private function makeCheaper(array &$plan, int $conditionId): string
    {
        $budgetFood = $this->firstAllowedFood($conditionId, '');

        if (! $budgetFood) {
            return 'No budget-friendly swap is available from allowed rules.';
        }

        foreach ($plan['plan'] ?? [] as &$day) {
            foreach ($day['meals'] ?? [] as &$meal) {
                if (preg_match('/beef|shawarma|steak|salmon|kabab/i', (string) ($meal['food'] ?? ''))) {
                    $meal['food'] = $budgetFood;
                    $meal['food_ar'] = $budgetFood;
                }
            }
        }

        return 'Plan adjusted toward simpler allowed foods.';
    }

    private function firstAllowedFood(int $conditionId, string $exclude): ?string
    {
        $rule = DietaryRule::where('condition_id', $conditionId)
            ->whereIn('status', ['allowed', 'moderate'])
            ->with('food:id,name')
            ->get()
            ->first(fn ($rule) => $rule->food && stripos($rule->food->name, $exclude) === false);

        if ($rule?->food?->name) {
            return $rule->food->name;
        }

        return GlobalRules::whereIn('status', ['allowed', 'moderate'])
            ->with('food:id,name')
            ->get()
            ->first(fn ($rule) => $rule->food && stripos($rule->food->name, $exclude) === false)
            ?->food?->name;
    }

    private function matchingFoods($foods, array $needles)
    {
        return $foods
            ->filter(fn ($food) => collect($needles)->contains(fn ($needle) => stripos($food, $needle) !== false))
            ->values();
    }

    private function belongsToAnyShoppingGroup(string $food): bool
    {
        $needles = ['chicken', 'beef', 'fish', 'egg', 'meat', 'tuna', 'kabab', 'salad', 'lettuce', 'tomato', 'cucumber', 'broccoli', 'vegetable', 'zucchini', 'tea', 'water', 'drink', 'juice', 'olive oil', 'avocado', 'olives', 'nuts', 'rice', 'toast', 'bread', 'pasta', 'potato'];

        return collect($needles)->contains(fn ($needle) => stripos($food, $needle) !== false);
    }
}
