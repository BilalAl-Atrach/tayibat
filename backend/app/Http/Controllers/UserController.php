<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{


    // app/Http/Controllers/UserController.php
public function index()
{
    return response()->json(
        User::select('id', 'name', 'email', 'condition', 'role', 'created_at')->latest()->limit(200)->get()
    );
}

public function getCondition(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }

    return response()->json(['condition' => $user->condition]);
}

public function updateCondition(Request $request)
{
    $request->validate([
        'condition' => 'required|string'
    ]);

    $user = $request->user();

    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }

    $user->condition = $request->condition;
    $user->save();

    return response()->json([
        'message' => 'Condition updated successfully',
        'condition' => $user->condition
    ]);
}



}
