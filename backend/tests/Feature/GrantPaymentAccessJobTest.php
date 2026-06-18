<?php

namespace Tests\Feature;

use App\Jobs\GrantPaymentAccess;
use App\Models\PaymentTransaction;
use App\Models\PaymentWebhookLog;
use App\Models\User;
use App\Services\BillingAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class GrantPaymentAccessJobTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
    }

    public function test_job_grants_access_for_paid_transaction(): void
    {
        // Create a user and paid transaction
        $user = User::factory()->create();
        $transaction = PaymentTransaction::factory()
            ->for($user)
            ->create(['status' => 'paid']);

        // Create webhook log
        $log = PaymentWebhookLog::create([
            'payment_transaction_id' => $transaction->id,
            'provider' => 'whish',
            'provider_reference' => 'ref_123',
            'signature_valid' => true,
        ]);

        // Execute job
        $job = new GrantPaymentAccess($transaction->id, $log->id);
        $job->handle(app(BillingAccessService::class));

        // Assert access was granted (subscription created)
        $this->assertNotNull($user->fresh()->activeSubscription());

        // Assert webhook log was updated
        $log->refresh();
        $this->assertStringContainsString('access granted', $log->message);
    }

    public function test_job_skips_unpaid_transaction(): void
    {
        // Create unpaid transaction
        $user = User::factory()->create();
        $transaction = PaymentTransaction::factory()
            ->for($user)
            ->create(['status' => 'pending']);

        // Execute job
        $job = new GrantPaymentAccess($transaction->id);
        $job->handle(app(BillingAccessService::class));

        // Assert no access was granted
        $this->assertNull($user->fresh()->activeSubscription());
    }

    public function test_job_handles_missing_transaction(): void
    {
        // Execute job with non-existent transaction
        $job = new GrantPaymentAccess(999);

        // Should not throw exception
        $job->handle(app(BillingAccessService::class));

        // Test passed
        $this->assertTrue(true);
    }

    public function test_job_is_idempotent(): void
    {
        // Create transaction and log
        $user = User::factory()->create();
        $transaction = PaymentTransaction::factory()
            ->for($user)
            ->create(['status' => 'paid']);

        $log = PaymentWebhookLog::create([
            'payment_transaction_id' => $transaction->id,
            'provider' => 'whish',
            'provider_reference' => 'ref_123',
            'signature_valid' => true,
        ]);

        $billingAccess = app(BillingAccessService::class);

        // Run job twice
        $job = new GrantPaymentAccess($transaction->id, $log->id);
        $job->handle($billingAccess);
        $job->handle($billingAccess);

        // Assert only one subscription created (idempotent)
        $this->assertEquals(1, $user->fresh()->subscriptions()->count());
    }

    public function test_job_can_retry_on_failure(): void
    {
        // Job should be retryable
        $job = new GrantPaymentAccess(1);
        $this->assertEquals(3, $job->tries);
    }

    public function test_job_records_failure_in_log(): void
    {
        $transaction = PaymentTransaction::factory()->create(['status' => 'paid']);
        $log = PaymentWebhookLog::create([
            'payment_transaction_id' => $transaction->id,
            'provider' => 'whish',
            'provider_reference' => 'ref_fail',
            'signature_valid' => true,
        ]);

        $job = new GrantPaymentAccess($transaction->id, $log->id);
        $exception = new \Exception('Test failure message');

        // Call failed method
        $job->failed($exception);

        // Assert log was updated with failure
        $log->refresh();
        $this->assertStringContainsString('FAILED', $log->message);
    }
}
