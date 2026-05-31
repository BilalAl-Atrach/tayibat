<?php

namespace App\Services;

use App\Models\DietaryRule;
use App\Models\Condition;
use App\Models\Food;
use App\Models\GlobalRules;   // ✅ new model
use App\Support\RiceGuidance;
use Illuminate\Support\Facades\Http;

class NutritionAIService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
    }

    public function handleQuestion($user, $food, $question = null)
    {
        $food = strtolower(trim($food));
        $question = $question ?: "Can I eat {$food}?";

        $riceGuidance = RiceGuidance::for($user->condition ?? null, $food, $question);

        if ($riceGuidance) {
            return $riceGuidance;
        }

        // Find food record
        $foodModel = Food::where('name', $food)->first();
        if (!$foodModel) {
            return $this->askAI($user, $food, $question);
        }

        // Find condition record
        $conditionModel = Condition::where('name', $user->condition)->first();

        // 🔥 Step 1: Check condition-specific rule
        $rule = DietaryRule::where('condition_id', $conditionModel->id ?? null)
            ->where('food_id', $foodModel->id)
            ->first();

        // 🔥 Step 2: If not found, check global rules
        if (!$rule) {
            $rule = GlobalRules::where('food_id', $foodModel->id)->first();
        }

        // 🔥 Step 3: Fallback to restricted_diet (optional safety net)
        if (!$rule) {
            $restricted = Condition::where('name', 'restricted_diet')->first();
            $rule = DietaryRule::where('condition_id', $restricted->id ?? null)
                ->where('food_id', $foodModel->id)
                ->first();
        }

        // ✅ If rule found → return
        if ($rule) {
            return [
                'status' => $rule->status,
                'message' => match($rule->status) {
                    'allowed' => "✅ You can eat this.",
                    'moderate' => "⚠️ Eat in moderation.",
                    'avoid' => "❌ Avoid this food."
                },
                'reason' => $rule->reason
            ];
        }

        // 🤖 Step 4: AI fallback
        return $this->askAI($user, $food, $question);
    }

    private function askAI($user, $food, $question)
    {
        $prompt = "
You are a nutrition assistant.

User condition: {$user->condition}
Food: {$food}

Question: {$question}

Give a short safe answer (max 2 lines).
";

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-5',
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
        ]);

        return [
            'status' => 'ai',
            'message' => $response['choices'][0]['message']['content'] ?? 'No answer'
        ];
    }
}
