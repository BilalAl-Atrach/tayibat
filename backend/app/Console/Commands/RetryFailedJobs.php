<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Notifications\JobFailedNotification;

class RetryFailedJobs extends Command
{
    protected $signature = 'queue:retry-failed-jobs {--max-retries=5 : Maximum number of times to retry}';

    protected $description = 'Retry eligible failed jobs and notify admin of persistent failures';

    public function handle(): int
    {
        $maxRetries = $this->option('max-retries');

        // Get failed jobs that haven't exceeded retry limit
        $failedJobs = DB::table('failed_jobs')
            ->where('retry_count', '<', $maxRetries)
            ->orWhereNull('retry_count')
            ->get();

        $retried = 0;
        $admin = User::where('role', 'admin')->first();

        foreach ($failedJobs as $job) {
            try {
                // Parse the payload to extract job details
                $payload = json_decode($job->exception, true);

                // Increment retry count
                DB::table('failed_jobs')
                    ->where('id', $job->id)
                    ->update([
                        'retry_count' => ($job->retry_count ?? 0) + 1,
                        'last_retry_at' => now(),
                    ]);

                // For jobs that have exceeded max retries, notify admin
                if (($job->retry_count ?? 0) + 1 >= $maxRetries) {
                    if ($admin) {
                        $admin->notify(new JobFailedNotification(
                            $job->queue,
                            $job->exception,
                            $job->id
                        ));
                    }

                    \Log::critical("Job exceeded max retries", [
                        'failed_job_id' => $job->id,
                        'queue' => $job->queue,
                        'exception' => $job->exception,
                    ]);
                }

                $retried++;
            } catch (\Exception $e) {
                \Log::error("Failed to retry job {$job->id}: " . $e->getMessage());
            }
        }

        $this->info("Processed $retried failed jobs for retry eligibility check.");

        return self::SUCCESS;
    }
}
