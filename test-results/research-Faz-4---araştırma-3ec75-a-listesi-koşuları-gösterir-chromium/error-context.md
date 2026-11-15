# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: research.spec.ts >> Faz 4 - araştırma ve eşleştirme >> araştırma listesi koşuları gösterir
- Location: src/tests/e2e/research.spec.ts:61:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 13

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+   "Failed to load resource: the server responded with a status of 400 (Bad Request)",
+ ]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e10]:
      - paragraph [ref=e11]: Product Intelligence
      - paragraph [ref=e12]: Pazar istihbarat paneli
    - navigation "Ana gezinme" [ref=e13]:
      - list [ref=e14]:
        - listitem [ref=e15]:
          - link "Genel Bakış" [ref=e16] [cursor=pointer]:
            - /url: /dashboard
        - listitem [ref=e22]:
          - link "Ürünler" [ref=e23] [cursor=pointer]:
            - /url: /products
        - listitem [ref=e28]:
          - link "Araştırma" [ref=e29] [cursor=pointer]:
            - /url: /research
        - listitem [ref=e33]:
          - link "Fiyat İzleme" [ref=e34] [cursor=pointer]:
            - /url: /monitoring
        - listitem [ref=e38]:
          - link "Fiyat Analizi" [ref=e39] [cursor=pointer]:
            - /url: /pricing-analysis
        - listitem [ref=e42]:
          - link "Veri Kaynakları" [ref=e43] [cursor=pointer]:
            - /url: /data-sources
        - listitem [ref=e48]:
          - link "Ayarlar" [ref=e49] [cursor=pointer]:
            - /url: /settings
    - generic [ref=e53]:
      - paragraph [ref=e54]: Yerel mod · Tek kullanıcı
      - paragraph [ref=e55]: Kimlik doğrulama bu sürümde bulunmaz.
  - generic [ref=e56]:
    - banner [ref=e57]:
      - button "Menüyü aç" [ref=e58]
      - generic [ref=e60]:
        - paragraph [ref=e61]: Araştırma
        - paragraph [ref=e62]: Product Intelligence
      - searchbox "Global ürün arama" [disabled] [ref=e67]
      - generic [ref=e68]:
        - generic [ref=e69]: "Kaynaklar: 1/4 hazır"
        - text: DEMO MOD
        - button "Yeni Araştırma" [ref=e70]
        - button "Koyu temaya geç" [ref=e72]
    - main [ref=e75]:
      - region "Araştırma" [ref=e77]:
        - generic [ref=e78]:
          - heading "Araştırma" [level=1] [ref=e79]
          - paragraph [ref=e80]: Araştırma koşuları ürün detayından “Piyasayı Araştır” ile başlatılır.
        - table [ref=e83]:
          - rowgroup [ref=e84]:
            - row [ref=e85]:
              - columnheader "Ürün" [ref=e86]
              - columnheader "Durum" [ref=e87]
              - columnheader "Teklif / birebir / muadil" [ref=e88]
              - columnheader "Kaynaklar" [ref=e89]
              - columnheader "Tarih" [ref=e90]
          - rowgroup [ref=e91]:
            - row [ref=e92]:
              - cell [ref=e93]:
                - link "Koşu c5430a43" [ref=e94] [cursor=pointer]:
                  - /url: /research/c5430a43-49d3-437e-8716-b3bdfed68d5e
                - paragraph [ref=e95]: a5ed93fb…
              - cell "Tamamlandı" [ref=e96]
              - cell "7 / 2 / 3" [ref=e97]
              - cell "demo" [ref=e98]
              - cell "15 Kas 2026 19:53" [ref=e99]
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * TEST_04: ürün → araştırma → exact/muadil sekmleri → onay/red akışı.
  5  |  */
  6  | test.describe("Faz 4 - araştırma ve eşleştirme", () => {
  7  |   let consoleErrors: string[] = [];
  8  | 
  9  |   test.beforeEach(({ page }) => {
  10 |     consoleErrors = [];
  11 |     page.on("console", (message) => {
  12 |       if (message.type() === "error") consoleErrors.push(message.text());
  13 |     });
  14 |     page.on("pageerror", (error) => consoleErrors.push(String(error)));
  15 |   });
  16 | 
  17 |   test("ürün detayından demo araştırma çalışır, exact/muadil ayrılır, onay kalıcıdır", async ({
  18 |     page,
  19 |   }: {
  20 |     page: Page;
  21 |   }) => {
  22 |     test.setTimeout(90_000);
  23 |     await page.setViewportSize({ width: 1440, height: 900 });
  24 | 
  25 |     // DemoProvider fixture'larıyla eşleşen ürünü bul (global seed: DEMO-001)
  26 |     await page.goto("/products");
  27 |     await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
  28 |     await page.getByRole("button", { name: "Filtrele" }).click();
  29 |     await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();
  30 | 
  31 |     await expect(page.getByRole("heading", { name: /Kablosuz Kulaklık ANC Pro/ })).toBeVisible();
  32 | 
  33 |     // Araştırmayı başlat
  34 |     await page.getByRole("button", { name: "Piyasayı Araştır" }).click();
  35 |     await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });
  36 | 
  37 |     // Sonuç sayfası: DEMO rozeti, sekmeler ve exact sonuçlar
  38 |     await expect(page.getByText("DEMO MOD").first()).toBeVisible();
  39 |     await expect(page.getByRole("tab", { name: /Birebir aynı/ })).toBeVisible();
  40 |     await expect(page.getByText("Birebir aynı", { exact: false }).first()).toBeVisible();
  41 |     const exactBadge = page.getByText("Birebir aynı").first();
  42 |     await expect(exactBadge).toBeVisible();
  43 | 
  44 |     // Muadil sekmesinde TechSound muadili görünür
  45 |     await page.getByRole("tab", { name: /Muadiller/ }).click();
  46 |     await expect(page.getByText(/TechSound|Ortak kullanım terimi/).first()).toBeVisible();
  47 | 
  48 |     // Onay işlemi: muadil sekmesinde ilk Onayla → durum kalıcı olmalı
  49 |     await page.getByRole("button", { name: "Onayla" }).first().click();
  50 |     await expect(page.getByText("Onaylandı").first()).toBeVisible();
  51 |     await page.reload();
  52 |     await page.getByRole("tab", { name: /Muadiller/ }).click();
  53 |     await expect(page.getByText("Onaylandı").first()).toBeVisible();
  54 | 
  55 |     // Tüm teklifler sekmesi
  56 |     await page.getByRole("tab", { name: /Tüm teklifler/ }).click();
  57 |     await expect(page.getByText("Kaynağa git").first()).toBeVisible();
  58 |     expect(consoleErrors).toEqual([]);
  59 |   });
  60 | 
  61 |   test("araştırma listesi koşuları gösterir", async ({ page }: { page: Page }) => {
  62 |     await page.setViewportSize({ width: 1440, height: 900 });
  63 |     await page.goto("/research");
  64 |     await expect(page.getByRole("heading", { name: "Araştırma" })).toBeVisible();
> 65 |     expect(consoleErrors).toEqual([]);
     |                           ^ Error: expect(received).toEqual(expected) // deep equality
  66 |   });
  67 | });
  68 | 
```