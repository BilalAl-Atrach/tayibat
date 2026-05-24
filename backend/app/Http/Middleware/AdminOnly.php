<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Admin access requires login.'], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Admin access is not allowed.'], 403);
        }

        return $next($request);
    }
}
