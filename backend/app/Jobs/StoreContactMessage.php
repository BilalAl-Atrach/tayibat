<?php

namespace App\Jobs;

use App\Models\ContactMessage;
use App\Models\User;
use App\Notifications\ContactMessageReceivedNotification;
use App\Notifications\JobFailedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class StoreContactMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(private readonly array $messageData) {}

    public function handle(): void
    {
        $message = ContactMessage::create($this->messageData);

        // Notify admin of new contact message
        $admin = User::where('role', 'admin')->first();
        if ($admin) {
            $admin->notify(new ContactMessageReceivedNotification(
                $this->messageData['name'] ?? 'Unknown',
                $this->messageData['email'] ?? 'unknown@example.com',
                $this->messageData['subject'] ?? 'No subject',
                $this->messageData['message'] ?? 'No message'
            ));
        }
    }

    public function failed(\Throwable $exception): void
    {
        // Log the failure
        \Log::error('Failed to store contact message', [
            'message_data' => $this->messageData,
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Notify admin of failure
        $admin = User::where('role', 'admin')->first();
        if ($admin) {
            $admin->notify(new JobFailedNotification(
                self::class,
                $exception->getMessage(),
                md5(json_encode($this->messageData))
            ));
        }
    }
}
