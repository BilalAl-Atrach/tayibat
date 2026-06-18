<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeFailedJobs extends Command
{
    protected $signature = 'queue:purge-failed-jobs {--days=14 : Number of days to retain}';

    protected $description = 'Purge failed jobs older than the specified number of days';

    public function handle(): int
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $deleted = DB::table('failed_jobs')
            ->where('failed_at', '<', $cutoffDate)
            ->delete();

        $this->info("Purged $deleted failed job records older than $days days.");

        // Log the action
        \Log::info("Purged $deleted failed jobs older than $days days", [
            'cutoff_date' => $cutoffDate,
            'timestamp' => now(),
        ]);

        return self::SUCCESS;
    }
}
