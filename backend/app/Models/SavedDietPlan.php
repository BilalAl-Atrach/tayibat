<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Condition;

class SavedDietPlan extends Model
{
    protected $fillable = [
        'user_id',
        'condition_id',
        'duration',
        'plan',
    ];

    protected $casts = [
        'plan' => 'array',
    ];

    public function condition()
    {
        return $this->belongsTo(Condition::class);
    }
}
