<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserFoodLog extends Model
{
    protected $fillable = [
        'user_id',
        'condition_id',
        'food_name',
        'meal_type',
        'logged_at',
        'notes',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];
}
