<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Condition extends Model
{
    protected $table = 'conditions';   // ✅ force correct table name
    protected $fillable = ['name', 'name_ar'];

    
    public function dietaryRules()
{
    return $this->hasMany(\App\Models\DietaryRule::class, 'condition_id');
}

}
