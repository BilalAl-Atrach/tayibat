<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentWebhookLog extends Model
{
    protected $fillable = [
        'payment_transaction_id',
        'provider',
        'provider_reference',
        'event_status',
        'signature_valid',
        'headers',
        'payload',
        'message',
    ];

    protected $casts = [
        'signature_valid' => 'boolean',
        'headers' => 'array',
        'payload' => 'array',
    ];

    public function transaction()
    {
        return $this->belongsTo(PaymentTransaction::class, 'payment_transaction_id');
    }
}
