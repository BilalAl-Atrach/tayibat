<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DietaryRule extends Model
{
    protected $table = 'dietary_rules';   // ✅ correct table name
// App\Models\DietaryRule.php
protected $fillable = [
    'food_id', 
    'condition_id', 
    'status', 
    'reason', 
    'reason_ar',
    'max_servings'         // Ensure this is here
];
 public function food()
{
    return $this->belongsTo(\App\Models\Food::class, 'food_id');
}

public function condition()
{
    return $this->belongsTo(\App\Models\Condition::class, 'condition_id');
}
}
