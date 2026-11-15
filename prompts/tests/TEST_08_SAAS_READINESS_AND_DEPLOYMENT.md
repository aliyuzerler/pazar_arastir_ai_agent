# TEST FAZ 8 — Workspace isolation and Vercel deployment readiness

1. Create two workspaces; each sees only own products/offers/research/history/recommendations.
2. Guessed object IDs from different workspace return not found/forbidden without data leakage.
3. Every repository requires workspace context.
4. `APP_MODE=production` with no auth and no private deployment gate refuses public-safe startup/requests.
5. DATABASE_URL points to PostgreSQL; no SQLite fallback.
6. Build passes with Vercel environment variable names.
7. Secrets absent from browser bundle and route response.
8. Cron secret validation works.
9. Vercel functions do not write persistent files to app directory or assume `/tmp` durability.
10. DB migration command documented and runs cleanly on blank Postgres.
11. Preview and Production env configuration documented separately.
12. Public launch checklist explicitly says SaaS auth/RBAC/RLS not complete if absent.
13. lint/typecheck/test/build pass.
