# TEST FAZ 0 — Bootstrap test ve kabul

1. Fresh clone simulation: `.env.example` -> `.env`; compose up; DB healthcheck passes.
2. `npm install` clean.
3. DB migration up succeeds from empty DB.
4. Seed creates exactly one default workspace; rerunning seed is idempotent.
5. `/api/health` returns app healthy and DB healthy; failed DB yields safe unhealthy response.
6. Missing DATABASE_URL fails startup with clear validation error, not secret dump.
7. lint, typecheck, unit test, build pass.
8. Playwright opens app shell and nav routes without console errors.
9. Confirm no API key exposed in client chunks.
10. Confirm SQLite dependency/file DB not present.

Report exact commands/output summary and blockers.
