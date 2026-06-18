<?php

namespace App\Console;

use App\Console\Commands\PurgeFailedJobs;
use App\Console\Commands\RetryFailedJobs;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        PurgeFailedJobs::class,
        RetryFailedJobs::class,
    ];

    protected function schedule(Schedule $schedule): void
    {
        // Purge failed jobs older than 14 days daily at 3 AM
        $schedule->command('queue:purge-failed-jobs')
            ->dailyAt('03:00')
            ->withoutOverlapping()
            ->onFailure(function () {
                \Log::error('Failed to purge old failed jobs');
            });

        // Retry failed jobs that are eligible for retry every 5 minutes
        $schedule->command('queue:retry-failed-jobs')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->onFailure(function () {
                \Log::error('Failed job retry process encountered an error');
            });

        // Clean up expired sessions every hour
        $schedule->command('session:gc')
            ->hourly()
            ->withoutOverlapping();

        // Monitor queue health - alert if jobs are stuck
        $schedule->call(function () {
            $stuck = \DB::table('jobs')
                ->where('reserved_at', '<', now()->subHours(1))
                ->count();

            if ($stuck > 10) {
                \Log::warning("Queue health warning: $stuck jobs appear stuck for over 1 hour");
                // Could send notification here
            }
        })->everyTenMinutes();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
