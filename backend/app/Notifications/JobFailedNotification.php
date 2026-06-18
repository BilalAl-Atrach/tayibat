<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $jobClass,
        private readonly string $exception,
        private readonly string $failedJobId
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('⚠️ Job Failed: ' . class_basename($this->jobClass))
            ->greeting('Hello Admin,')
            ->line('A critical background job has failed after all retry attempts.')
            ->line("**Job Class:** {$this->jobClass}")
            ->line("**Failed Job ID:** {$this->failedJobId}")
            ->line("**Error:** {$this->exception}")
            ->action('View Failed Jobs', route('admin.failed-jobs'))
            ->line('Please investigate immediately to prevent data loss or customer impact.')
            ->line('If this is a payment-related job, customers may not have received their access grants.')
            ->salutation('Best regards, Tayibat System');
    }
}
