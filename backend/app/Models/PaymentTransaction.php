<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'diet_plan_duration',
        'condition_id',
        'amount',
        'currency',
        'status',
        'provider',
        'provider_reference',
        'checkout_url',
        'provider_payload',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'provider_payload' => 'array',
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function condition()
    {
        return $this->belongsTo(Condition::class);
    }
}
