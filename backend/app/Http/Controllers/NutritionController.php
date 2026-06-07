<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\NutritionAIService;
use App\Models\Condition;
use App\Models\DietaryRule;
use App\Models\DietPlanPurchase;
use App\Models\Food;
use App\Models\GlobalRules;
use App\Models\User;
use App\Support\RiceGuidance;

class NutritionController extends Controller
{
    protected $service;

    public function __construct(NutritionAIService $service)
    {
        $this->service = $service;
    }

    // ✅ Step 1: Fetch all conditions
    public function getConditions()
    {
        return response()->json(Condition::all());
    }

    // ✅ Step 2: Handle food questions
public function ask(Request $request)
{
    $foodName    = strtolower(trim($request->food));
    $condition = $this->resolveCondition($request->condition, $request->user_id);
    $conditionId = $condition?->id;
    $conditionName = $condition?->name ?? $request->condition;
    $question = "Can I eat {$foodName}?";

    $riceGuidance = RiceGuidance::for($conditionName, $foodName, $request->input('question', $question));

    if ($riceGuidance) {
        return response()->json([
            'status'              => $riceGuidance['status'],
            'message'             => $riceGuidance['message'],
            'reason'              => $riceGuidance['reason'],
            'max_servings'        => null,
        ]);
    }

    // 1. Try to find a Condition-Specific Rule
    $rule = DietaryRule::whereHas('food', function ($q) use ($foodName) {
            $q->whereRaw('LOWER(name) = ?', [$foodName]);
        })
        ->where('condition_id', $conditionId)
        ->first();

    // 2. If not found, try to find a Global Rule
    if (!$rule) {
        $rule = GlobalRules::whereHas('food', function ($q) use ($foodName) {
                $q->whereRaw('LOWER(name) = ?', [$foodName]);
            })
            ->first();
    }

    // 3. If a rule was found (either Specific or Global), return it
    if ($rule) {
        return response()->json([
            'status'              => $rule->status,
            'message'             => match ($rule->status) {
                'allowed'  => "✅ You can eat this.",
                'moderate' => "⚠️ Eat in moderation.",
                'avoid'    => "❌ Avoid this food.",
                default    => "ℹ️ No specific rule found."
            },
            'reason'              => $rule->reason,
            'max_servings'        => $rule instanceof DietaryRule ? $rule->max_servings : null,
        ]);
    }

    // 4. Fallback to AI...
    // (Rest of your AI code remains the same)


        // 🤖 Fallback to AI service (include nutrition, but no dietary rule reason available)
        $aiResponse = $this->service->handleQuestion(
            (object)['condition' => $conditionName],
            $foodName,
            $question
        );

        return response()->json([
            'status'              => $aiResponse['status'] ?? 'ai',
            'message'             => $aiResponse['message'] ?? 'No answer',
            'reason'              => $aiResponse['reason'] ?? 'No dietary rule found for this food.',
            'max_servings'        => null,
        ]);
    }

    public function dietPlan(Request $request)
    {
        $request->validate([
            'duration' => 'required|string',
            'condition' => 'nullable',
            'user_id' => 'nullable|integer',
        ]);

        $condition = $this->resolveCondition($request->condition, $request->user_id);

        if (! $condition) {
            return response()->json([
                'message' => 'Please select a health goal before generating a diet plan.',
                'plan' => [],
            ], 422);
        }

        $days = $this->durationToDays($request->duration);

        if (! $days) {
            return response()->json([
                'message' => 'Duration must be 1 week, 1 month, or 3 months.',
                'plan' => [],
            ], 422);
        }

        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Please log in before generating a diet plan.',
                'plan' => [],
            ], 401);
        }

        $isAdmin = strtolower((string) $user->role) === 'admin';
        $dietPlanPurchase = DietPlanPurchase::where('user_id', $user->id)
            ->where('condition_id', $condition->id)
            ->where('duration', $request->duration)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();
        $hasDietPlanAccess = $isAdmin || $dietPlanPurchase;

        if (! $hasDietPlanAccess) {
            return response()->json([
                'message' => 'Please purchase the ' . $request->duration . ' diet plan package for ' . $condition->name . ' before generating this plan.',
                'upgrade_required' => true,
                'package' => 'diet_plan',
                'duration' => $request->duration,
                'condition_id' => $condition->id,
                'plan' => [],
            ], 402);
        }

        if (! $isAdmin && $dietPlanPurchase?->generated_plan) {
            $savedPlan = $dietPlanPurchase->generated_plan;

            return response()->json([
                'condition' => $savedPlan['condition'] ?? $condition->name,
                'condition_ar' => $savedPlan['condition_ar'] ?? $condition->name_ar,
                'duration' => $savedPlan['duration'] ?? $request->duration,
                'days' => $savedPlan['days'] ?? $days,
                'message' => 'Your saved diet plan is ready.',
                'plan' => $savedPlan['plan'] ?? [],
                'generated_at' => $dietPlanPurchase->generated_at,
                'expires_at' => $dietPlanPurchase->expires_at,
                'from_saved_plan' => true,
            ]);
        }

        $conditionRules = DietaryRule::where('condition_id', $condition->id)
            ->whereIn('status', ['allowed', 'moderate'])
            ->with('food:id,name,name_ar,meal_type,meal_role')
            ->get();

        $globalRules = GlobalRules::whereIn('status', ['allowed', 'moderate'])
            ->with('food:id,name,name_ar,meal_type,meal_role')
            ->get();

        $rules = $conditionRules
            ->concat($globalRules)
            ->filter(fn ($rule) => $rule->food)
            ->unique(fn ($rule) => $rule->food->id . '-' . $rule->status)
            ->values();

        if ($rules->isEmpty()) {
            return response()->json([
                'condition' => $condition->name,
                'duration' => $request->duration,
                'message' => 'No allowed or moderate foods are available for this goal yet.',
                'plan' => [],
            ]);
        }

        $mealTemplates = [
            'Breakfast' => [
                'type' => 'breakfast',
                'roles' => ['main' => 1, 'side' => 1, 'drink' => 1],
                'fallback_count' => 2,
            ],
            'Lunch' => [
                'type' => 'lunch',
                'roles' => ['main' => 1, 'side' => 1, 'fat' => 1],
                'fallback_count' => 2,
            ],
            'Dinner' => [
                'type' => 'dinner',
                'roles' => ['main' => 1],
                'fallback_count' => 1,
            ],
            'Snack' => [
                'type' => 'snack',
                'roles' => ['snack' => 1],
                'fallback_count' => 1,
            ],
        ];
        $plan = [];

        for ($day = 1; $day <= $days; $day++) {
            $meals = [];
            $mealIndex = 0;

            foreach ($mealTemplates as $mealName => $template) {
                $mealType = $template['type'];
                $matchingRules = $rules
                    ->filter(function ($rule) use ($mealType) {
                        $foodMealType = strtolower(trim((string) $rule->food->meal_type));

                        return $foodMealType === $mealType || $foodMealType === 'any';
                    })
                    ->values();

                $mealRules = $matchingRules->isNotEmpty() ? $matchingRules : $rules;
                $ruleOffset = $matchingRules->isNotEmpty() ? $day - 1 : $day + $mealIndex - 1;
                $selectedRules = collect();
                $selectedFoodIds = [];
                $soloSelected = false;
                $soloRules = $mealRules
                    ->filter(fn ($rule) => strtolower(trim((string) $rule->food->meal_role)) === 'solo')
                    ->values();

                if ($soloRules->isNotEmpty() && (($day + $mealIndex) % 5 === 0)) {
                    $selectedRules = collect([$soloRules[intdiv($day + $mealIndex, 5) % $soloRules->count()]]);
                    $soloSelected = true;
                } else {
                    foreach ($template['roles'] as $role => $count) {
                        for ($roleIndex = 0; $roleIndex < $count; $roleIndex++) {
                            $rule = $this->pickRuleForRole(
                                $mealRules,
                                $role,
                                $ruleOffset + $roleIndex + $selectedRules->count(),
                                $selectedFoodIds
                            );

                            if ($rule) {
                                $selectedRules->push($rule);
                                $selectedFoodIds[] = $rule->food->id;
                            }
                        }
                    }
                }

                if ($selectedRules->isEmpty()) {
                    $selectedRules = $this->pickFallbackRules(
                        $mealRules,
                        $template['fallback_count'],
                        $ruleOffset
                    );
                } elseif (! $soloSelected) {
                    $selectedRules = $selectedRules
                        ->reject(fn ($rule) => strtolower(trim((string) $rule->food->meal_role)) === 'solo')
                        ->values();
                }

                $soloFallback = $selectedRules->first(
                    fn ($rule) => strtolower(trim((string) $rule->food->meal_role)) === 'solo'
                );

                if ($soloFallback) {
                    $selectedRules = collect([$soloFallback]);
                }

                $meals[] = [
                    'meal' => $mealName,
                    'food' => $selectedRules->pluck('food.name')->join(' + '),
                    'food_ar' => $selectedRules->map(fn ($rule) => $rule->food->name_ar ?: $rule->food->name)->join(' + '),
                    'foods' => $selectedRules->map(fn ($rule) => [
                        'name' => $rule->food->name,
                        'name_ar' => $rule->food->name_ar,
                        'meal_type' => $rule->food->meal_type,
                        'meal_role' => $rule->food->meal_role,
                        'status' => $rule->status,
                        'reason' => $rule->reason,
                        'reason_ar' => $rule->reason_ar ?? null,
                        'max_servings' => $rule->max_servings ?? null,
                    ])->values(),
                    'meal_type' => $mealType,
                    'status' => $selectedRules->contains(fn ($rule) => $rule->status === 'moderate')
                        ? 'moderate'
                        : 'allowed',
                    'reason' => $selectedRules
                        ->pluck('reason')
                        ->filter()
                        ->join(' | '),
                    'reason_ar' => $selectedRules
                        ->pluck('reason_ar')
                        ->filter()
                        ->join(' | '),
                    'max_servings' => null,
                ];

                $mealIndex++;
            }

            $plan[] = [
                'day' => $day,
                'label' => 'Day ' . $day,
                'meals' => $meals,
            ];
        }

        $response = [
            'condition' => $condition->name,
            'condition_ar' => $condition->name_ar,
            'duration' => $request->duration,
            'days' => $days,
            'message' => 'Diet plan generated from existing allowed and moderate food rules.',
            'plan' => $plan,
        ];

        if (! $isAdmin && $dietPlanPurchase) {
            $dietPlanPurchase->update([
                'generated_plan' => $response,
                'generated_at' => now(),
            ]);

            $response['generated_at'] = $dietPlanPurchase->fresh()->generated_at;
            $response['expires_at'] = $dietPlanPurchase->fresh()->expires_at;
            $response['from_saved_plan'] = false;
        }

        return response()->json($response);
    }

    private function resolveCondition($conditionInput = null, $userId = null): ?Condition
    {
        if ($conditionInput) {
            return Condition::where('id', $conditionInput)
                ->orWhere('name', $conditionInput)
                ->orWhere('name_ar', $conditionInput)
                ->first();
        }

        if ($userId) {
            $user = User::find($userId);

            if ($user?->condition) {
                return Condition::where('name', $user->condition)->first();
            }
        }

        return null;
    }

    private function durationToDays(string $duration): ?int
    {
        return match (strtolower(trim($duration))) {
            '1 week', 'week', '7 days' => 7,
            '1 month', 'month', '30 days' => 30,
            '3 months', 'three months', '90 days' => 90,
            default => null,
        };
    }

    private function pickRuleForRole($rules, string $role, int $offset, array $excludedFoodIds = [])
    {
        $matchingRules = $rules
            ->filter(function ($rule) use ($role, $excludedFoodIds) {
                $foodRole = strtolower(trim((string) $rule->food->meal_role));

                return ! in_array($rule->food->id, $excludedFoodIds)
                    && ($foodRole === $role || $foodRole === 'any');
            })
            ->values();

        if ($matchingRules->isEmpty()) {
            return null;
        }

        return $matchingRules[$offset % $matchingRules->count()];
    }

    private function pickFallbackRules($rules, int $count, int $offset)
    {
        $selectedRules = collect();
        $usedFoodIds = [];
        $count = min($count, $rules->count());

        for ($index = 0; $index < $count; $index++) {
            $rule = $rules[($offset + $index) % $rules->count()];

            if (in_array($rule->food->id, $usedFoodIds)) {
                continue;
            }

            $selectedRules->push($rule);
            $usedFoodIds[] = $rule->food->id;
        }

        return $selectedRules->isNotEmpty()
            ? $selectedRules
            : collect([$rules[$offset % $rules->count()]]);
    }
}
