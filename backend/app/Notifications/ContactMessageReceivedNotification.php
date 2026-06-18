<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactMessageReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $visitorName,
        private readonly string $visitorEmail,
        private readonly string $subject,
        private readonly string $message
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Contact Message: {$this->subject}")
            ->greeting('Hello Admin,')
            ->line('You have received a new contact message from your website.')
            ->line("**From:** {$this->visitorName} ({$this->visitorEmail})")
            ->line("**Subject:** {$this->subject}")
            ->line("**Message:**")
            ->line($this->message)
            ->action('Reply to Message', route('admin.contact-messages.show', ['email' => $this->visitorEmail]))
            ->salutation('Best regards, Tayibat System');
    }
}
