<?php

namespace App\Jobs;

use App\Models\PaymentTransaction;
use App\Models\PaymentWebhookLog;
use App\Models\User;
use App\Notifications\JobFailedNotification;
use App\Services\BillingAccessService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GrantPaymentAccess implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        private readonly int $paymentTransactionId,
        private readonly ?int $paymentWebhookLogId = null
    ) {}

    public function handle(BillingAccessService $billingAccess): void
    {
        $transaction = PaymentTransaction::find($this->paymentTransactionId);

        if (! $transaction || $transaction->status !== 'paid') {
            return;
        }

        $billingAccess->grantForTransaction($transaction);

        if ($this->paymentWebhookLogId) {
            PaymentWebhookLog::where('id', $this->paymentWebhookLogId)
                ->update(['message' => 'Payment confirmed and access granted.']);
        }
    }

    public function failed(\Throwable $exception): void
    {
        // Log the failure
        \Log::error('Failed to grant payment access', [
            'transaction_id' => $this->paymentTransactionId,
            'webhook_log_id' => $this->paymentWebhookLogId,
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Update webhook log with failure message
        if ($this->paymentWebhookLogId) {
            PaymentWebhookLog::where('id', $this->paymentWebhookLogId)
                ->update(['message' => 'FAILED: ' . $exception->getMessage()]);
        }

        // Notify admin of failure
        $admin = User::where('role', 'admin')->first();
        if ($admin) {
            $admin->notify(new JobFailedNotification(
                self::class,
                $exception->getMessage(),
                (string)$this->paymentTransactionId
            ));
        }
    }
}
