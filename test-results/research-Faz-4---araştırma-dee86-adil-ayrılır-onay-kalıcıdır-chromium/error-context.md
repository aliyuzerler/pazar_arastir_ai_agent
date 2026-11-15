# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: research.spec.ts >> Faz 4 - araştırma ve eşleştirme >> ürün detayından demo araştırma çalışır, exact/muadil ayrılır, onay kalıcıdır
- Location: src/tests/e2e/research.spec.ts:17:3

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
> 35 |     await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
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
  65 |     expect(consoleErrors).toEqual([]);
  66 |   });
  67 | });
  68 | 
```