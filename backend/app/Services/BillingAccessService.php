<?php

namespace App\Services;

use App\Models\DietPlanPurchase;
use App\Models\PaymentTransaction;
use App\Models\Subscription;

class BillingAccessService
{
    private const PREMIUM_PRICE = 15;
    private const PREMIUM_DURATION_MONTHS = 1;
    private const DIET_PLAN_PRICES = [
        '1 week' => 9,
        '1 month' => 15,
        '3 months' => 30,
    ];

    public function grantForTransaction(PaymentTransaction $transaction): void
    {
        if ($transaction->type === 'premium') {
            Subscription::updateOrCreate(
                ['user_id' => $transaction->user_id, 'plan' => 'premium'],
                [
                    'status' => 'active',
                    'price' => self::PREMIUM_PRICE,
                    'started_at' => now(),
                    'expires_at' => now()->addMonths(self::PREMIUM_DURATION_MONTHS),
                ]
            );

            return;
        }

        if ($transaction->type === 'diet_plan' && $transaction->diet_plan_duration && $transaction->condition_id) {
            DietPlanPurchase::updateOrCreate(
                [
                    'user_id' => $transaction->user_id,
                    'condition_id' => $transaction->condition_id,
                    'duration' => $transaction->diet_plan_duration,
                ],
                [
                    'price' => self::DIET_PLAN_PRICES[$transaction->diet_plan_duration],
                    'status' => 'active',
                    'paid_at' => now(),
                    'expires_at' => $this->dietPlanExpiresAt($transaction->diet_plan_duration),
                ]
            );
        }
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
