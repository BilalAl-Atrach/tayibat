# Railway Queue Worker

After adding a Redis service and setting `QUEUE_CONNECTION=redis`, create a second Railway service or worker process for the backend and use this start command:

```bash
php artisan queue:work redis --sleep=1 --tries=3 --max-time=3600 --memory=256
```

Keep the normal Laravel web service running separately. The worker should not receive web traffic.
