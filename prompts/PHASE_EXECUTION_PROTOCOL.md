# ZCode Faz Yürütme Protokolü

Her faz promptunu ayrı ayrı çalıştır. Aynı anda birden fazla fazı uygulatma.

1. ZCode önce `AGENTS.md`, ilgili skill dosyaları ve ilgili docs'ları tekrar okusun.
2. Mevcut repository durumunu ve önceki fazın raporunu incelesin.
3. İstenen faz dışındaki özellikleri uygulamasın.
4. Kod yazmadan önce 5–12 maddelik kısa uygulama planı sunsun.
5. Planı uygulayıp uygun testleri yazsın.
6. Tamamlandığında karşılık gelen `prompts/tests/TEST_XX_*.md` dosyasını baştan sona uygulasın.
7. Lint, typecheck, unit, integration, e2e (faz kapsamına göre) ve build komutlarını çalıştırsın.
8. Hataları düzeltmeden fazı tamamlandı saymasın.
9. Dokümanlar ile kodu senkronize etsin.
10. Sonuç raporunda: değişen dosyalar, komutlar, test sayıları, test sonucu, bilinen riskler, sonraki faza hazırlık yer alsın.

## ZCode için sabit komut

> Bu fazı uygula; ancak sonraki faza geçme. AGENTS.md ve ilgili skill'lere uy. Önce repo durumunu kontrol et. Koddan önce plan yap. Gerçek API anahtarları yoksa DemoProvider veya mock fixture kullan; sahte canlı veri üretme. Her bilinmeyen veri alanını null/unknown tut. Fazın sonunda ilgili TEST promptunu tam uygula, lint/typecheck/test/build çalıştır, başarısızlıkları gider ve raporla.
