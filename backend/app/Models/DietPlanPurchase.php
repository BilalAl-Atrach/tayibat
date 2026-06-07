<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DietPlanPurchase extends Model
{
    protected $fillable = [
        'user_id',
        'condition_id',
        'duration',
        'price',
        'status',
        'paid_at',
        'generated_plan',
        'generated_at',
        'expires_at',
    ];

    protected $casts = [
        'price' => 'float',
        'paid_at' => 'datetime',
        'generated_plan' => 'array',
        'generated_at' => 'datetime',
        'expires_at' => 'datetime',
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
