# FAZ 8 — SaaS-ready tenancy ve Vercel deployment readiness

`security-multitenant` ve `vercel-deployment` skill'lerini oku.

## Hedef
Kullanıcı kaydı eklemeden workspace izolasyonunu, public deployment gate'ini ve Vercel + managed Postgres deployment hazırlığını tamamla.

## Yapılacaklar
1. Audit every repository/service query: workspace scoped.
2. Add cross-workspace integration tests.
3. Workspace context server-side; do not trust query/body workspace id.
4. Add production safety: if auth disabled and APP_MODE=production, refuse startup/route with explicit safe error unless private deployment gate config enabled.
5. Vercel env docs, build settings, managed Postgres setup and migration procedure.
6. Vercel Blob/S3 adapter interface for later product assets/imports; no local persistent file assumption.
7. Cron secret validation, small batch resume.
8. Add secure headers, rate limiting and CSV hardening.
9. Deployment smoke checks and `vercel.json` if needed.
10. Auth/RBAC SaaS future checklist; do not implement signup unless separately requested.

## Sınırlar
- Do not claim public SaaS-ready until auth, membership, RBAC and RLS are implemented.
- SQLite must not be used in production.
- Do not expose data provider API keys.
