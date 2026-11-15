# FAZ 4 — Araştırma orkestrasyonu ve exact/muadil eşleştirme

`product-domain`, `provider-integration` ve `e2e-quality` skill'lerini oku.

## Hedef
Ürün için araştırma çalıştır; exact ve substitute sonuçları ayrı sınıflandır; kullanıcı match'i onaylayıp reddedebilsin.

## Yapılacaklar
1. research_runs, offers, product_matches tabloları.
2. ResearchOrchestrator with provider selection, bounded concurrency, idempotency, retry, partial success.
3. Search query planning: title/brand/model/MPN/GTIN/category/attributes; query variants.
4. Offer normalization and duplicate detection.
5. Deterministic exact matching priority: GTIN -> MPN+brand -> brand+model+critical attributes.
6. Substitute classifier using category/use/spec comparison; AI helper optional but validate output.
7. Match reasons and differences JSON.
8. Research result UI: exact, likely exact, substitutes, all offers; filters and sorting.
9. Manual approve/reject match actions.
10. Source, last observed, shipping/availability unknown labels, partial results panel.

## Sınırlar
- Title-only match may not be exact.
- LLM must not invent price, stock, GTIN or seller.
- Unknown stock quantity stays null.
