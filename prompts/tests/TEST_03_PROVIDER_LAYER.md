# TEST FAZ 3 — Provider contracts

1. DemoProvider returns deterministic fixture records across exact/substitute/unknown stock/no shipping scenarios.
2. Every DemoProvider item carries `is_demo=true`, source and observed timestamp.
3. Provider registry reports Demo ready and live provider not configured when env secrets absent.
4. DataForSEO key never appears in browser bundle, HTML, API response, logs or error messages.
5. Valid fixture is normalized preserving price/currency/source URL/availability.
6. Missing stock quantity remains null; missing availability becomes unknown.
7. Unknown shipping does not become zero.
8. 429 maps to rate_limited; 401/403 to authentication/configuration error; timeout to timeout.
9. Provider error does not crash registry or erase other provider response.
10. Bad response schema rejected safely.
11. Provider calls have timeout and bounded retry.
12. lint/typecheck/unit/contract/build pass.
