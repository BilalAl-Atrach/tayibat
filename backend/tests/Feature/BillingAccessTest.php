<?php

namespace Tests\Feature;

use App\Models\Condition;
use App\Models\DietPlanPurchase;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_billing_access_requires_login(): void
    {
        $this->getJson('/api/billing/access')
            ->assertUnauthorized();
    }

    public function test_free_user_can_only_consume_two_ai_questions(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/billing/ai-usage/consume')->assertOk()
            ->assertJsonPath('remaining', 1);

        $this->postJson('/api/billing/ai-usage/consume')->assertOk()
            ->assertJsonPath('remaining', 0);

        $this->postJson('/api/billing/ai-usage/consume')
            ->assertStatus(402)
            ->assertJsonPath('upgrade_required', true);
    }

    public function test_admin_has_premium_and_all_diet_plan_access(): void
    {
        $condition = Condition::create(['name' => 'Diabetes']);
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->getJson('/api/billing/access?condition_id=' . $condition->id)
            ->assertOk()
            ->assertJsonPath('premium', true)
            ->assertJsonPath('diet_plan_access.1 week', true)
            ->assertJsonPath('diet_plan_access.1 month', true)
            ->assertJsonPath('diet_plan_access.3 months', true);
    }

    public function test_admin_marking_premium_transaction_paid_grants_one_month_subscription(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $transaction = PaymentTransaction::create([
            'user_id' => $user->id,
            'type' => 'premium',
            'amount' => 15,
            'currency' => 'USD',
            'status' => 'pending',
            'provider' => 'whish',
            'provider_reference' => 'TAY-TEST-PREMIUM',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/payment-transactions/{$transaction->id}/mark-paid")
            ->assertOk();

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'plan' => 'premium',
            'status' => 'active',
            'price' => 15,
        ]);

        $this->assertNotNull(Subscription::where('user_id', $user->id)->first()?->expires_at);
    }

    public function test_admin_marking_diet_plan_transaction_paid_grants_goal_specific_access(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $condition = Condition::create(['name' => 'Diabetes']);
        $transaction = PaymentTransaction::create([
            'user_id' => $user->id,
            'type' => 'diet_plan',
            'diet_plan_duration' => '1 week',
            'condition_id' => $condition->id,
            'amount' => 9,
            'currency' => 'USD',
            'status' => 'pending',
            'provider' => 'whish',
            'provider_reference' => 'TAY-TEST-PLAN',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/payment-transactions/{$transaction->id}/mark-paid")
            ->assertOk();

        $this->assertDatabaseHas('diet_plan_purchases', [
            'user_id' => $user->id,
            'condition_id' => $condition->id,
            'duration' => '1 week',
            'status' => 'active',
            'price' => 9,
        ]);

        $this->assertNotNull(DietPlanPurchase::where('user_id', $user->id)->first()?->paid_at);
    }

    public function test_whish_callback_requires_signature_when_secret_is_configured(): void
    {
        config(['services.whish.secret_key' => 'test-secret']);

        $user = User::factory()->create();
        $transaction = PaymentTransaction::create([
            'user_id' => $user->id,
            'type' => 'premium',
            'amount' => 15,
            'currency' => 'USD',
            'status' => 'pending',
            'provider' => 'whish',
            'provider_reference' => 'TAY-SIGNED-ONLY',
        ]);

        $this->postJson('/api/billing/whish/callback', [
            'reference' => $transaction->provider_reference,
            'status' => 'paid',
        ])->assertForbidden();

        $this->assertDatabaseMissing('subscriptions', [
            'user_id' => $user->id,
            'plan' => 'premium',
            'status' => 'active',
        ]);
    }
}
