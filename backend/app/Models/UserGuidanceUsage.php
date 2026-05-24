<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserGuidanceUsage extends Model
{
    protected $fillable = [
        'user_id',
        'ai_questions_used',
    ];

    protected $casts = [
        'ai_questions_used' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
