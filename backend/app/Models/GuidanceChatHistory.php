<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuidanceChatHistory extends Model
{
    protected $fillable = [
        'user_id',
        'condition_id',
        'messages',
    ];

    protected $casts = [
        'messages' => 'array',
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
