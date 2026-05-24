<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Food extends Model
{
    protected $table = 'foods';   // ✅ force correct table name
	protected $fillable = ['name', 'name_ar', 'meal_type', 'meal_role'];
}
