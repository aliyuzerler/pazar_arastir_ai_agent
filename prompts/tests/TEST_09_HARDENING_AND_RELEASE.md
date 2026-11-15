# TEST FAZ 9 — Final release candidate E2E

Execute full E2E journey: create product -> run research -> exact/substitute review -> store price snapshot -> view history -> configure price profile -> generate all strategies -> enable monitoring -> run scheduled job -> observe alert.

Additional checks:
1. No console errors or unhandled promise rejection.
2. No secret leakage in HTML, client JS or network response.
3. All provider failure/partial/no result/stale/no history states usable.
4. All monetary calculations deterministic and decimal-safe.
5. Every external offer has provenance.
6. Exact and substitute metrics do not mix.
7. CSV import/export tested with malformed and formula-injection data.
8. Workspace separation tests pass.
9. Accessibility keyboard/focus/contrast checks pass.
10. Visual screenshots at 1440x900, 1024x768 and 390x844 in light/dark; inspect layout issues.
11. Database indexes and pagination tested with a larger seed dataset.
12. Lint, typecheck, unit, integration, e2e and production build all pass.
13. Update release checklist with pass/fail/evidence and list remaining non-critical issues.

Do not claim release-ready if any critical/high risk remains open.
