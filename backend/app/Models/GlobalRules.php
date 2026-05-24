<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlobalRules extends Model
{
    protected $table = 'global_rules';
    protected $fillable = [
        'food_id', 
        'condition_id', 
        'status', 
        'reason',
        'reason_ar',
    ];

public function food()
{
    return $this->belongsTo(\App\Models\Food::class, 'food_id');
}
}


