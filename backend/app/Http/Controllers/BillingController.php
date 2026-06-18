<?php

namespace App\Http\Controllers;

use App\Jobs\GrantPaymentAccess;
use App\Models\DietPlanPurchase;
use App\Models\PaymentTransaction;
use App\Models\PaymentWebhookLog;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserGuidanceUsage;
use App\Services\WhishPaymentService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BillingController extends Controller
{
    private const PREMIUM_PRICE = 15;
    private const PREMIUM_DURATION_MONTHS = 1;
    private const AI_FREE_LIMIT = 2;
    private const DIET_PLAN_PRICES = [
        '1 week' => 9,
        '1 month' => 15,
        '3 months' => 30,
    ];

    public function access(Request $request)
    {
        $user = $request->user();
        $usage = UserGuidanceUsage::firstOrCreate(
            ['user_id' => $user->id],
            ['ai_questions_used' => 0]
        );

        $isAdmin = $this->isAdmin($user);
        $premium = $this->hasPremiumAccess($user);
        $conditionId = $request->integer('condition_id') ?: null;
        $purchasedDurations = DietPlanPurchase::where('user_id', $user->id)
            ->when($conditionId, fn ($query) => $query->where('condition_id', $conditionId))
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->pluck('duration')
            ->all();

        return response()->json([
            'premium' => $premium,
            'prices' => [
                'premium' => self::PREMIUM_PRICE,
                'diet_plans' => self::DIET_PLAN_PRICES,
            ],
            'ai' => [
                'free_limit' => self::AI_FREE_LIMIT,
                'used' => $usage->ai_questions_used,
                'remaining' => $premium ? null : max(0, self::AI_FREE_LIMIT - $usage->ai_questions_used),
                'unlimited' => $premium,
            ],
            'diet_plan_access' => collect(self::DIET_PLAN_PRICES)
                ->mapWithKeys(fn ($price, $duration) => [
                    $duration => $isAdmin || ($conditionId && in_array($duration, $purchasedDurations, true)),
                ])
                ->all(),
        ]);
    }

    public function checkout(Request $request, WhishPaymentService $whish)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['premium', 'diet_plan'])],
            'duration' => ['required_if:type,diet_plan', 'nullable', Rule::in(array_keys(self::DIET_PLAN_PRICES))],
            'condition_id' => ['required_if:type,diet_plan', 'nullable', 'exists:conditions,id'],
        ]);

        $type = $validated['type'];
        $duration = $validated['duration'] ?? null;
        $amount = $type === 'premium'
            ? self::PREMIUM_PRICE
            : self::DIET_PLAN_PRICES[$duration];

        $transaction = PaymentTransaction::create([
            'user_id' => $request->user()->id,
            'type' => $type,
            'diet_plan_duration' => $duration,
            'condition_id' => $type === 'diet_plan' ? $validated['condition_id'] : null,
            'amount' => $amount,
            'currency' => 'USD',
            'status' => 'pending',
            'provider' => 'whish',
        ]);

        $checkout = $whish->createCheckout($transaction);

        $transaction->update([
            'provider_reference' => $checkout['provider_reference'],
            'checkout_url' => $checkout['checkout_url'],
            'provider_payload' => $checkout['provider_payload'],
        ]);

        if (! $checkout['configured']) {
            $transaction->delete();

            return response()->json([
                'message' => 'Payment is not configured yet. Add the payment provider credentials before accepting payments.',
                'checkout_url' => null,
                'whish_configured' => false,
            ], 503);
        }

        if (! $checkout['checkout_url']) {
            $transaction->update(['status' => 'failed']);

            return response()->json([
                'message' => 'The payment provider did not return a checkout link. Please check the payment API settings.',
                'checkout_url' => null,
                'whish_configured' => true,
                'transaction' => [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'duration' => $transaction->diet_plan_duration,
                    'condition_id' => $transaction->condition_id,
                    'amount' => $transaction->amount,
                    'currency' => $transaction->currency,
                    'status' => $transaction->status,
                ],
            ], 502);
        }

        return response()->json([
            'message' => 'Redirect the user to complete payment.',
            'checkout_url' => $checkout['checkout_url'],
            'whish_configured' => $checkout['configured'],
            'transaction' => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'duration' => $transaction->diet_plan_duration,
                'condition_id' => $transaction->condition_id,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'status' => $transaction->status,
            ],
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'access' => $this->access($request)->getData(true),
            'subscriptions' => Subscription::where('user_id', $user->id)
                ->latest()
                ->get(),
            'diet_plan_purchases' => DietPlanPurchase::where('user_id', $user->id)
                ->with('condition:id,name,name_ar')
                ->latest()
                ->get(),
            'transactions' => PaymentTransaction::where('user_id', $user->id)
                ->with('condition:id,name,name_ar')
                ->latest()
                ->limit(50)
                ->get(),
        ]);
    }

    public function consumeAiQuestion(Request $request)
    {
        $user = $request->user();

        if ($this->hasPremiumAccess($user)) {
            return response()->json([
                'allowed' => true,
                'unlimited' => true,
                'remaining' => null,
            ]);
        }

        $usage = UserGuidanceUsage::firstOrCreate(
            ['user_id' => $user->id],
            ['ai_questions_used' => 0]
        );

        if ($usage->ai_questions_used >= self::AI_FREE_LIMIT) {
            return response()->json([
                'message' => 'Free users can ask 2 AI questions. Upgrade to Premium for unlimited AI guidance.',
                'upgrade_required' => true,
                'package' => 'premium',
                'price' => self::PREMIUM_PRICE,
            ], 402);
        }

        $usage->increment('ai_questions_used');
        $usage->refresh();

        return response()->json([
            'allowed' => true,
            'unlimited' => false,
            'used' => $usage->ai_questions_used,
            'remaining' => max(0, self::AI_FREE_LIMIT - $usage->ai_questions_used),
        ]);
    }

    public function callback(Request $request)
    {
        $transactionId = $request->input('transaction_id') ?: data_get($request->all(), 'metadata.transaction_id');
        $reference = $request->input('reference')
            ?: $request->input('provider_reference')
            ?: $request->input('merchant_reference')
            ?: $request->input('payment_id');
        $status = strtolower((string) ($request->input('status') ?: $request->input('payment_status')));
        $signatureValid = $this->verifyWhishSignature($request);

        $log = PaymentWebhookLog::create([
            'provider' => 'whish',
            'provider_reference' => $reference,
            'event_status' => $status ?: null,
            'signature_valid' => $signatureValid,
            'headers' => $this->safeHeaders($request),
            'payload' => $request->all(),
            'message' => $signatureValid === false ? 'Invalid callback signature.' : 'Callback received.',
        ]);

        if ($signatureValid === false) {
            return response()->json(['message' => 'Invalid payment callback signature.'], 403);
        }

        if (! $transactionId && ! $reference) {
            $log->update(['message' => 'Payment reference is required.']);

            return response()->json(['message' => 'Payment reference is required.'], 422);
        }

        $transaction = PaymentTransaction::query()
            ->where(function ($query) use ($transactionId, $reference) {
                if ($transactionId) {
                    $query->orWhere('id', $transactionId);
                }

                if ($reference) {
                    $query->orWhere('provider_reference', $reference);
                }
            })
            ->first();

        if (! $transaction) {
            $log->update(['message' => 'Payment transaction not found.']);

            return response()->json(['message' => 'Payment transaction not found.'], 404);
        }

        $paid = in_array($status, ['paid', 'success', 'successful', 'completed', 'approved'], true);

        $transaction->update([
            'status' => $paid ? 'paid' : ($status ?: 'pending'),
            'provider_payload' => $request->all(),
            'paid_at' => $paid ? ($transaction->paid_at ?: now()) : $transaction->paid_at,
        ]);

        if ($paid) {
            GrantPaymentAccess::dispatch($transaction->id, $log->id);
        }

        $log->update([
            'payment_transaction_id' => $transaction->id,
            'message' => $paid ? 'Payment confirmed. Access grant queued.' : 'Payment callback received.',
        ]);

        return response()->json([
            'message' => $paid ? 'Payment confirmed. Access grant queued.' : 'Payment callback received.',
            'paid' => $paid,
        ]);
    }

    public function adminTransactions()
    {
        $transactions = PaymentTransaction::with(['user:id,name,email', 'condition:id,name,name_ar'])
            ->latest()
            ->limit(100)
            ->get();

        return response()->json($transactions);
    }

    public function adminSubscriptions()
    {
        $subscriptions = Subscription::with('user:id,name,email')
            ->latest()
            ->limit(100)
            ->get();

        $dietPlanPurchases = DietPlanPurchase::with(['user:id,name,email', 'condition:id,name,name_ar'])
            ->latest()
            ->limit(100)
            ->get();

        return response()->json([
            'subscriptions' => $subscriptions,
            'diet_plan_purchases' => $dietPlanPurchases,
        ]);
    }

    public function adminWebhookLogs()
    {
        return response()->json(
            PaymentWebhookLog::with('transaction.user:id,name,email')
                ->latest()
                ->limit(100)
                ->get()
        );
    }

    public function markTransactionPaid(PaymentTransaction $transaction)
    {
        $transaction->update([
            'status' => 'paid',
            'paid_at' => $transaction->paid_at ?: now(),
        ]);

        GrantPaymentAccess::dispatch($transaction->id);

        return response()->json([
            'message' => 'Payment marked as paid. Access grant queued.',
            'transaction' => $transaction->fresh()->load('user:id,name,email'),
        ]);
    }

    public function markTransactionFailed(PaymentTransaction $transaction)
    {
        $transaction->update(['status' => 'failed']);

        return response()->json([
            'message' => 'Payment marked as failed.',
            'transaction' => $transaction->fresh()->load('user:id,name,email'),
        ]);
    }

    public function grantPremium(User $user)
    {
        Subscription::updateOrCreate(
            ['user_id' => $user->id, 'plan' => 'premium'],
            [
                'status' => 'active',
                'price' => self::PREMIUM_PRICE,
                'started_at' => now(),
                'expires_at' => now()->addMonths(self::PREMIUM_DURATION_MONTHS),
            ]
        );

        return response()->json(['message' => 'Premium access granted.']);
    }

    public function revokePremium(User $user)
    {
        Subscription::where('user_id', $user->id)
            ->where('plan', 'premium')
            ->update([
                'status' => 'revoked',
                'expires_at' => now(),
            ]);

        return response()->json(['message' => 'Premium access revoked.']);
    }

    public function resetAiUsage(User $user)
    {
        UserGuidanceUsage::updateOrCreate(
            ['user_id' => $user->id],
            ['ai_questions_used' => 0]
        );

        return response()->json(['message' => 'AI usage reset.']);
    }

    public function grantDietPlanAccess(Request $request, User $user)
    {
        $validated = $request->validate([
            'duration' => ['required', Rule::in(array_keys(self::DIET_PLAN_PRICES))],
            'condition_id' => ['required', 'exists:conditions,id'],
        ]);

        DietPlanPurchase::updateOrCreate(
            ['user_id' => $user->id, 'condition_id' => $validated['condition_id'], 'duration' => $validated['duration']],
            [
                'price' => self::DIET_PLAN_PRICES[$validated['duration']],
                'status' => 'active',
                'paid_at' => now(),
                'expires_at' => $this->dietPlanExpiresAt($validated['duration']),
            ]
        );

        return response()->json(['message' => 'Diet plan access granted.']);
    }

    public function revokeDietPlanAccess(Request $request, User $user)
    {
        $validated = $request->validate([
            'duration' => ['required', Rule::in(array_keys(self::DIET_PLAN_PRICES))],
            'condition_id' => ['required', 'exists:conditions,id'],
        ]);

        DietPlanPurchase::where('user_id', $user->id)
            ->where('condition_id', $validated['condition_id'])
            ->where('duration', $validated['duration'])
            ->update(['status' => 'revoked']);

        return response()->json(['message' => 'Diet plan access revoked.']);
    }

    private function hasPremiumAccess($user): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return Subscription::where('user_id', $user->id)
            ->where('plan', 'premium')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    private function isAdmin($user): bool
    {
        return strtolower((string) $user?->role) === 'admin';
    }

    private function verifyWhishSignature(Request $request): ?bool
    {
        $secret = config('services.whish.secret_key');
        $signature = $request->header('X-Whish-Signature')
            ?: $request->header('X-Signature')
            ?: $request->input('signature');

        if (! $secret) {
            return null;
        }

        if (! $signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        $normalizedSignature = str_starts_with($signature, 'sha256=')
            ? substr($signature, 7)
            : $signature;

        return hash_equals($expected, $normalizedSignature);
    }

    private function safeHeaders(Request $request): array
    {
        return collect($request->headers->all())
            ->except(['authorization', 'cookie', 'x-whish-signature', 'x-signature'])
            ->all();
    }

    private function dietPlanExpiresAt(string $duration)
    {
        return match (strtolower(trim($duration))) {
            '1 week' => now()->addWeek(),
            '1 month' => now()->addMonth(),
            '3 months' => now()->addMonths(3),
            default => now()->addMonth(),
        };
    }
}
