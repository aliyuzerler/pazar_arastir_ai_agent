# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: price-history.spec.ts >> Faz 5 - fiyat geçmişi >> araştırma sonrası ürün detayında fiyat geçmişi oluşur ve CSV dışa aktarılır
- Location: src/tests/e2e/price-history.spec.ts:14:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=f2e2]:
  - complementary [ref=f2e3]:
    - generic [ref=f2e10]:
      - paragraph [ref=f2e11]: Product Intelligence
      - paragraph [ref=f2e12]: Pazar istihbarat paneli
    - navigation "Ana gezinme" [ref=f2e13]:
      - list [ref=f2e14]:
        - listitem [ref=f2e15]:
          - link "Genel Bakış" [ref=f2e16] [cursor=pointer]:
            - /url: /dashboard
        - listitem [ref=f2e22]:
          - link "Ürünler" [ref=f2e23] [cursor=pointer]:
            - /url: /products
        - listitem [ref=f2e28]:
          - link "Araştırma" [ref=f2e29] [cursor=pointer]:
            - /url: /research
        - listitem [ref=f2e33]:
          - link "Fiyat İzleme" [ref=f2e34] [cursor=pointer]:
            - /url: /monitoring
        - listitem [ref=f2e38]:
          - link "Fiyat Analizi" [ref=f2e39] [cursor=pointer]:
            - /url: /pricing-analysis
        - listitem [ref=f2e42]:
          - link "Veri Kaynakları" [ref=f2e43] [cursor=pointer]:
            - /url: /data-sources
        - listitem [ref=f2e48]:
          - link "Ayarlar" [ref=f2e49] [cursor=pointer]:
            - /url: /settings
    - generic [ref=f2e53]:
      - paragraph [ref=f2e54]: Yerel mod · Tek kullanıcı
      - paragraph [ref=f2e55]: Kimlik doğrulama bu sürümde bulunmaz.
  - generic [ref=f2e56]:
    - banner [ref=f2e57]:
      - button "Menüyü aç" [ref=f2e58]
      - generic [ref=f2e60]:
        - paragraph [ref=f2e61]: Genel Bakış
        - paragraph [ref=f2e62]: Product Intelligence
      - searchbox "Global ürün arama" [disabled] [ref=f2e67]
      - generic [ref=f2e68]:
        - generic [ref=f2e69]: "Kaynaklar: 1/4 hazır"
        - text: DEMO MOD
        - button "Yeni Araştırma" [ref=f2e70]
        - button "Koyu temaya geç" [ref=f2e72]
    - main [ref=f2e75]:
      - region "Kablosuz Kulaklık ANC Pro" [ref=f2e77]:
        - link "Ürünlere dön" [ref=f2e78] [cursor=pointer]:
          - /url: /products
        - generic [ref=f2e81]:
          - generic [ref=f2e82]:
            - heading "Kablosuz Kulaklık ANC Pro" [level=1] [ref=f2e83]
            - paragraph [ref=f2e84]:
              - generic [ref=f2e85]: 15 Kas 2026 19:53 tarihinde eklendi
              - text: Aktif
          - generic [ref=f2e86]:
            - link [ref=f2e87] [cursor=pointer]:
              - /url: /products/a5ed93fb-48f4-4bb4-b9ed-777dedeb8d0b/edit
              - button "Düzenle" [ref=f2e88]
            - button "Arşivle" [ref=f2e92]
        - generic [ref=f2e93]:
          - generic [ref=f2e94]:
            - generic [ref=f2e95]:
              - heading "Ürün bilgileri" [level=3] [ref=f2e96]
              - paragraph [ref=f2e97]: GTIN normalize edilir; orijinal değer korunur.
            - generic [ref=f2e99]:
              - generic [ref=f2e100]:
                - term [ref=f2e101]: Marka
                - definition [ref=f2e102]: SesMark
              - generic [ref=f2e103]:
                - term [ref=f2e104]: Model
                - definition [ref=f2e105]: ANC-P
              - generic [ref=f2e106]:
                - term [ref=f2e107]: MPN
                - definition [ref=f2e108]: SM-ANC-P-BLK
              - generic [ref=f2e109]:
                - term [ref=f2e110]: GTIN (orijinal)
                - definition [ref=f2e111]: "8690000000012"
              - generic [ref=f2e112]:
                - term [ref=f2e113]: GTIN (normalize)
                - definition [ref=f2e114]: "08690000000012"
              - generic [ref=f2e115]:
                - term [ref=f2e116]: SKU
                - definition [ref=f2e117]: DEMO-001
              - generic [ref=f2e118]:
                - term [ref=f2e119]: Kategori
                - definition [ref=f2e120]: Elektronik / Ses Sistemleri
          - generic [ref=f2e121]:
            - generic [ref=f2e122]:
              - heading "Maliyet girdileri" [level=3] [ref=f2e123]
              - paragraph [ref=f2e124]: Fiyat önerileri bu girdiler + onaylı piyasa teklifleriyle hesaplanır.
            - generic [ref=f2e126]:
              - generic [ref=f2e127]:
                - term [ref=f2e128]: Birim alış maliyeti
                - definition [ref=f2e129]: ₺850,00
              - generic [ref=f2e130]:
                - term [ref=f2e131]: Giriş kargo / birim
                - definition [ref=f2e132]: ₺12,50
              - generic [ref=f2e133]:
                - term [ref=f2e134]: Paketleme
                - definition [ref=f2e135]: ₺3,00
              - generic [ref=f2e136]:
                - term [ref=f2e137]: Diğer sabit maliyet
                - definition [ref=f2e138]: ₺2,00
        - generic [ref=f2e139]:
          - generic [ref=f2e140]:
            - generic [ref=f2e141]:
              - heading "Piyasa araştırması" [level=3] [ref=f2e142]
              - paragraph [ref=f2e143]: DemoProvider anahtarsız çalışır; sonuçlar DEMO etiketli gelir.
            - button "Piyasayı Araştır" [active] [ref=f2e145]
          - generic [ref=f2e150]:
            - paragraph [ref=f2e151]: Bu ürün için henüz araştırma yapılmadı
            - paragraph [ref=f2e152]: “Piyasayı Araştır” ile birebir ürün ve muadil teklifleri toplanır; eşleşmeleri onaylayıp fiyat analizine temel oluşturursunuz.
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test.describe("Faz 5 - fiyat geçmişi", () => {
  4  |   let consoleErrors: string[] = [];
  5  | 
  6  |   test.beforeEach(({ page }) => {
  7  |     consoleErrors = [];
  8  |     page.on("console", (message) => {
  9  |       if (message.type() === "error") consoleErrors.push(message.text());
  10 |     });
  11 |     page.on("pageerror", (error) => consoleErrors.push(String(error)));
  12 |   });
  13 | 
  14 |   test("araştırma sonrası ürün detayında fiyat geçmişi oluşur ve CSV dışa aktarılır", async ({
  15 |     page,
  16 |   }) => {
  17 |     test.setTimeout(120_000);
  18 |     await page.setViewportSize({ width: 1440, height: 900 });
  19 | 
  20 |     await page.goto("/products");
  21 |     await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
  22 |     await page.getByRole("button", { name: "Filtrele" }).click();
  23 |     await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();
  24 |     await page.getByRole("button", { name: "Piyasayı Araştır" }).click();
> 25 |     await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  26 | 
  27 |     // Ürün detayına dön → fiyat geçmişi bölümü dolu olmalı
  28 |     await page.goto("/products");
  29 |     await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
  30 |     await page.getByRole("button", { name: "Filtrele" }).click();
  31 |     await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();
  32 | 
  33 |     await expect(page.getByText("Fiyat geçmişi")).toBeVisible();
  34 |     await expect(page.getByTestId("price-stats")).toBeVisible();
  35 |     await expect(page.getByText("İlk gözlem")).toBeVisible();
  36 |     await expect(page.getByTestId("price-history-chart")).toBeVisible();
  37 |     // Sağlayıcı geçmişi ayrı seri olarak işaretlenir
  38 |     await expect(page.getByText(/Sağlayıcı geçmişi: \d+ nokta/)).toBeVisible();
  39 | 
  40 |     // CSV dışa aktarma: source_kind ve tarih sütunları taşınır
  41 |     const download = await page.getByRole("link", { name: /CSV indir/ }).getAttribute("href");
  42 |     expect(download).toContain("/price-history/export");
  43 |     const response = await page.request.get(download!);
  44 |     expect(response.status()).toBe(200);
  45 |     expect(response.headers()["content-type"]).toContain("text/csv");
  46 |     const csv = await response.text();
  47 |     expect(csv).toContain("source_kind");
  48 |     expect(csv).toContain("our_snapshot");
  49 |     expect(csv).toContain("provider_history");
  50 |     // Formül nötralizasyonu: başlayan "=" hücresi saf geçemez
  51 |     expect(csv.split("\n").every((line) => !/^=/.test(line))).toBe(true);
  52 |     expect(consoleErrors).toEqual([]);
  53 |   });
  54 | 
  55 |   test("araştırma yapılmamış ürün boş geçmiş durumu gösterir", async ({ page }) => {
  56 |     await page.setViewportSize({ width: 1440, height: 900 });
  57 |     // DEMO-002 termostat için araştırma yok
  58 |     await page.goto("/products");
  59 |     await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-002");
  60 |     await page.getByRole("button", { name: "Filtrele" }).click();
  61 |     await page.getByRole("link", { name: /Termostat/ }).first().click();
  62 |     await expect(page.getByText("Henüz fiyat geçmişi yok")).toBeVisible();
  63 |     expect(consoleErrors).toEqual([]);
  64 |   });
  65 | });
  66 | 
```