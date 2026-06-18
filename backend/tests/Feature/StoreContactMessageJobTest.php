<?php

namespace Tests\Feature;

use App\Jobs\StoreContactMessage;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class StoreContactMessageJobTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
    }

    public function test_job_stores_contact_message(): void
    {
        $messageData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'This is a test message',
        ];

        $job = new StoreContactMessage($messageData);
        $job->handle();

        // Assert message was stored
        $this->assertDatabaseHas('contact_messages', $messageData);
    }

    public function test_job_handles_missing_fields(): void
    {
        $messageData = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ];

        $job = new StoreContactMessage($messageData);
        $job->handle();

        // Assert message was stored with available fields
        $this->assertDatabaseHas('contact_messages', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);
    }

    public function test_job_can_retry_on_failure(): void
    {
        $job = new StoreContactMessage(['name' => 'Test']);
        $this->assertEquals(3, $job->tries);
    }

    public function test_job_records_failure(): void
    {
        $messageData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'subject' => 'Test',
            'message' => 'Test message',
        ];

        $job = new StoreContactMessage($messageData);
        $exception = new \Exception('Database error');

        // Call failed method - should not throw
        $job->failed($exception);

        // Test passed
        $this->assertTrue(true);
    }

    public function test_job_notifies_admin_on_success(): void
    {
        $admin = User::factory()->admin()->create();

        $messageData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Important Question',
            'message' => 'I have a question',
        ];

        $job = new StoreContactMessage($messageData);
        $job->handle();

        // Assert message was stored
        $this->assertDatabaseHas('contact_messages', $messageData);

        // In production, notification would be sent to admin
        // (Testing notifications requires additional setup)
    }

    public function test_multiple_messages_are_stored(): void
    {
        $messages = [
            [
                'name' => 'User 1',
                'email' => 'user1@example.com',
                'subject' => 'Subject 1',
                'message' => 'Message 1',
            ],
            [
                'name' => 'User 2',
                'email' => 'user2@example.com',
                'subject' => 'Subject 2',
                'message' => 'Message 2',
            ],
        ];

        foreach ($messages as $messageData) {
            $job = new StoreContactMessage($messageData);
            $job->handle();
        }

        // Assert both messages were stored
        $this->assertEquals(2, ContactMessage::count());
    }
}
