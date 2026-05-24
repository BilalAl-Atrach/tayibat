<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuidanceFeedback extends Model
{
    protected $table = 'guidance_feedback';

    protected $fillable = [
        'user_id',
        'condition_id',
        'condition_name',
        'rating',
        'message',
    ];

    protected $casts = [
        'rating' => 'integer',
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
