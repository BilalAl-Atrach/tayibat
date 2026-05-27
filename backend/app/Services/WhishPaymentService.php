<?php

namespace App\Services;

use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WhishPaymentService
{
    public function configured(): bool
    {
        return filled(config('services.whish.merchant_id'))
            && filled(config('services.whish.secret_key'))
            && filled(config('services.whish.api_url'));
    }

    public function createCheckout(PaymentTransaction $transaction): array
    {
        $reference = $transaction->provider_reference ?: 'TAY-' . $transaction->id . '-' . Str::upper(Str::random(6));

        if (! $this->configured()) {
            return [
                'configured' => false,
                'provider_reference' => $reference,
                'checkout_url' => null,
                'provider_payload' => [
                    'message' => 'Payment is not configured yet. Add the payment provider values in .env.',
                ],
            ];
        }

        $payload = [
            'merchant_id' => config('services.whish.merchant_id'),
            'secret_key' => config('services.whish.secret_key'),
            'amount' => $transaction->amount,
            'currency' => $transaction->currency,
            'reference' => $reference,
            'description' => $this->description($transaction),
            'callback_url' => config('services.whish.callback_url'),
            'success_url' => config('services.whish.success_url'),
            'cancel_url' => config('services.whish.cancel_url'),
            'metadata' => [
                'transaction_id' => $transaction->id,
                'type' => $transaction->type,
                'diet_plan_duration' => $transaction->diet_plan_duration,
                'condition_id' => $transaction->condition_id,
            ],
        ];

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->post(config('services.whish.api_url'), $payload);

            $body = $response->json() ?? [];
            $checkoutUrl = data_get($body, 'checkout_url')
                ?: data_get($body, 'payment_url')
                ?: data_get($body, 'redirect_url')
                ?: data_get($body, 'data.checkout_url')
                ?: data_get($body, 'data.payment_url')
                ?: data_get($body, 'data.redirect_url');

            return [
                'configured' => true,
                'provider_reference' => data_get($body, 'reference')
                    ?: data_get($body, 'payment_id')
                    ?: data_get($body, 'data.reference')
                    ?: data_get($body, 'data.payment_id')
                    ?: $reference,
                'checkout_url' => $checkoutUrl,
                'provider_payload' => [
                    'request' => collect($payload)->except('secret_key')->all(),
                    'response_status' => $response->status(),
                    'response' => $body ?: $response->body(),
                ],
            ];
        } catch (\Throwable $exception) {
            return [
                'configured' => true,
                'provider_reference' => $reference,
                'checkout_url' => null,
                'provider_payload' => [
                    'request' => collect($payload)->except('secret_key')->all(),
                    'error' => $exception->getMessage(),
                ],
            ];
        }
    }

    private function description(PaymentTransaction $transaction): string
    {
        if ($transaction->type === 'premium') {
            return 'Tayibat Premium Access - 1 Month';
        }

        $condition = $transaction->condition?->name;

        return 'Tayibat ' . $transaction->diet_plan_duration . ' Diet Plan' . ($condition ? ' - ' . $condition : '');
    }
}
