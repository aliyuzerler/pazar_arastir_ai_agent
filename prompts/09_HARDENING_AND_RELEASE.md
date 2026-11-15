# FAZ 9 — Uçtan uca kalite, performans ve sürüm adayı

`e2e-quality`, `security-multitenant`, `ui-ux-monochrome` skill'lerini ve `docs/11_RELEASE_CHECKLIST.md` oku.

## Hedef
Ürün akışını güvenilir release candidate haline getir; açık kalan riskleri görünür raporla.

## Yapılacaklar
1. Full E2E: create product -> demo research -> review exact/substitute -> price observation -> pricing recommendation -> enable tracking -> alert.
2. Error/partial/empty/stale/no-history scenarios.
3. Provider adapter contract coverage.
4. Security review: secrets, SSRF (if URL fetch exists), csv, auth deployment gate, workspace scoping, cron.
5. Performance: table pagination, indexes, query plans, chart point aggregation.
6. Accessibility: keyboard, contrast, semantic headings, screen-reader labels.
7. Visual QA screenshots 1440x900, 1024x768, 390x844 light/dark.
8. Build and deployment smoke test.
9. Remove unused mock screens, dead code, TODOs without owner.
10. Update docs and release checklist; provide known issue register.

## Kabul
No critical/high bug open; lint/typecheck/unit/integration/e2e/build pass; production safety gate verified; docs reflect actual deployment path.
