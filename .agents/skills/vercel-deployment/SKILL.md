# Skill: Vercel Deployment

- Next.js app deploys to Vercel.
- PostgreSQL is external managed Postgres, provisioned via Vercel Marketplace (for example Neon); not a persistent SQLite file.
- Vercel Functions filesystem must not be used as persistent storage. `/tmp` is scratch only.
- Uploads go to object storage (Vercel Blob/S3-compatible), not local disk.
- Provider requests bounded by function timeout and concurrency.
- Scheduled monitoring uses Vercel Cron + small resumable batches; protect route with CRON_SECRET.
- Long-running queue workers belong on separate worker platform if workload outgrows bounded serverless jobs.
- Environment variables set separately for Development/Preview/Production.
- Run migrations in controlled release step.
- Before public launch, require authentication; no-auth MVP remains local/private.
