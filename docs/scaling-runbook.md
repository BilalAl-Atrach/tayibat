# Tayibat Scaling Runbook

This repo is now prepared for the first production scaling step, but infrastructure still has to be configured in Railway/Vercel.

## 1. Redis caching

Add a Redis service in Railway and set these variables on the Laravel backend service:

```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_URL=redis://default:password@host:6379
REDIS_CACHE_CONNECTION=cache
REDIS_QUEUE_CONNECTION=default
```

After changing variables, redeploy and run:

```bash
php artisan optimize:clear
php artisan config:cache
```

## 2. Queue worker

Create a second Railway service or worker process using the same backend codebase.

Worker start command:

```bash
php artisan queue:work redis --sleep=1 --tries=3 --max-time=3600 --memory=256
```

Keep this separate from the web process.

## 3. Multiple backend replicas

In Railway, scale the Laravel backend service horizontally after Redis is enabled. Sessions/cache must not depend on one instance.

Start with 2 replicas, watch CPU, memory, error rate, and database connections, then increase gradually.

## 4. CDN

The frontend now sends CDN-friendly cache headers for:

- `/_next/static/*`
- public images
- `/`
- `/about`
- `/pricing`
- `/products`
- `/contact`
- legal/static pages

Do not cache account, admin, payment, or API responses.

## 5. Database pooling and replicas

For serious scale, add connection pooling before adding many app replicas. If Railway/MySQL connection limits are low, the backend will bottleneck before CPU does.

For read replicas, route heavy public reads such as conditions/rules to replicas only after the primary database is healthy and replication lag is monitored.

## 6. Load testing

Install k6, then run:

```bash
k6 run load-tests/k6-tayibat.js
```

With custom target:

```bash
BASE_URL=https://tayibatai.com API_BASE_URL=https://tayibatai.com/api/laravel k6 run load-tests/k6-tayibat.js
```

AI chat load testing is disabled by default. Enable it only against staging or with strict limits:

```bash
AI_VUS=5 AUTH_COOKIE="tayibat_auth=your-test-cookie" k6 run load-tests/k6-tayibat.js
```

Do not run large AI tests on production unless you are ready for OpenAI cost and rate-limit impact.
