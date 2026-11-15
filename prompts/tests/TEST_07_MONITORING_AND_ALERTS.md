# TEST FAZ 7 — Monitoring and scheduled jobs

1. Enable tracking for product and create scheduled job.
2. Disable tracking prevents future scheduled jobs.
3. Job runs bounded batch and records status/attempts.
4. Two workers cannot process the same locked job concurrently.
5. Retry on transient failure; stop retry on auth/config error.
6. Provider quota/daily budget prevents excess calls.
7. Price-change alert fires only after observed price difference exceeds configured threshold.
8. Availability alert fires only when provider reports a change.
9. Alert includes observed timestamp and source.
10. Cron route without CRON_SECRET receives 401/403; with secret processes a limited batch.
11. Repeated cron trigger is idempotent.
12. Local worker shutdown releases/expirs locks safely.
13. lint/typecheck/unit/integration/e2e/build pass.
