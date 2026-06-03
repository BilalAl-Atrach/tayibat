<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserReminder extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'frequency',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];
}
