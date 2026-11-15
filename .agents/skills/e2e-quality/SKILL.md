# Skill: End-to-end Quality Engineering

- Turn every acceptance criterion into at least one executable check.
- Prefer real local PostgreSQL for integration tests; do not mock DB repository behavior in all tests.
- Use stable selectors (`data-testid`) only where accessible role/name is insufficient.
- Cover empty/loading/error/partial/stale/demo states.
- Test the complete user journey: product -> research -> match -> snapshot -> pricing.
- Add negative tests for invalid/missing/null/duplicate data.
- Capture desktop/tablet/mobile screenshots.
- Never mark a phase complete with skipped tests unless explicitly documented as blocked.
