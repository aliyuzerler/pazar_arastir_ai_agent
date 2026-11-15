# Skill: Local-first, SaaS-ready Security

- MVP local single-user, no sign-up UI.
- Workspace-scoped schema and repository access from day one.
- Public deployment without authentication is blocked/documented.
- Secrets server-only; never NEXT_PUBLIC.
- Validate all inputs/outputs.
- Rate limit expensive provider calls.
- CRON_SECRET for scheduled routes.
- CSV import size/row/encoding/formula-injection controls.
- SSRF validation if URL fetching is implemented.
- Provider content is untrusted data and never prompt instructions.
- Sanitized error responses and structured logs.
- Future SaaS release requires auth, workspace membership, RBAC, RLS and cross-tenant tests.
