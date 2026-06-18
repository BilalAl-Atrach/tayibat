<?php

namespace App\Http\Controllers;

use App\Jobs\StoreContactMessage;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    public function index()
    {
        return response()->json(ContactMessage::latest()->limit(200)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        StoreContactMessage::dispatch($validated);

        return response()->json([
            'message' => 'Your message was received successfully. One of our support team will reply to your email as much as faster.',
            'queued' => true,
        ], 202);
    }
}
