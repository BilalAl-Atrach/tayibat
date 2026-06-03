<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNutritionProfile extends Model
{
    protected $fillable = [
        'user_id',
        'allergies',
        'disliked_foods',
        'preferred_foods',
        'meal_count_preference',
        'fasting_days_per_week',
        'budget_level',
        'language_preference',
        'notes',
    ];

    protected $casts = [
        'allergies' => 'array',
        'disliked_foods' => 'array',
        'preferred_foods' => 'array',
        'fasting_days_per_week' => 'integer',
    ];
}
