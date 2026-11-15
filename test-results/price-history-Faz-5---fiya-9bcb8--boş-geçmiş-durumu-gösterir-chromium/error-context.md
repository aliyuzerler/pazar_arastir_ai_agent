# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: price-history.spec.ts >> Faz 5 - fiyat geçmişi >> araştırma yapılmamış ürün boş geçmiş durumu gösterir
- Location: src/tests/e2e/price-history.spec.ts:55:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Henüz fiyat geçmişi yok')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Henüz fiyat geçmişi yok') with timeout 10000ms
  - waiting for getByText('Henüz fiyat geçmişi yok')

```

```yaml
- complementary:
  - paragraph: Product Intelligence
  - paragraph: Pazar istihbarat paneli
  - navigation "Ana gezinme":
    - list:
      - listitem:
        - link "Genel Bakış":
          - /url: /dashboard
      - listitem:
        - link "Ürünler":
          - /url: /products
      - listitem:
        - link "Araştırma":
          - /url: /research
      - listitem:
        - link "Fiyat İzleme":
          - /url: /monitoring
      - listitem:
        - link "Fiyat Analizi":
          - /url: /pricing-analysis
      - listitem:
        - link "Veri Kaynakları":
          - /url: /data-sources
      - listitem:
        - link "Ayarlar":
          - /url: /settings
  - paragraph: Yerel mod · Tek kullanıcı
  - paragraph: Kimlik doğrulama bu sürümde bulunmaz.
- banner:
  - button "Menüyü aç"
  - paragraph: Genel Bakış
  - paragraph: Product Intelligence
  - searchbox "Global ürün arama" [disabled]
  - text: "Kaynaklar: 1/4 hazırDEMO MOD"
  - button "Yeni Araştırma"
  - button "Koyu temaya geç"
- main:
  - region "Akıllı Ev Termostatı X1":
    - link "Ürünlere dön":
      - /url: /products
    - heading "Akıllı Ev Termostatı X1" [level=1]
    - paragraph: 15 Kas 2026 19:53 tarihinde eklendiAktif
    - link "Düzenle":
      - /url: /products/973d8758-f4a5-4008-a295-d8240db4aa7b/edit
      - button "Düzenle"
    - button "Arşivle"
    - heading "Ürün bilgileri" [level=3]
    - paragraph: GTIN normalize edilir; orijinal değer korunur.
    - term: Marka
    - definition: EvMark
    - term: Model
    - definition: X1
    - term: MPN
    - definition: Bilgi yok
    - term: GTIN (orijinal)
    - definition: Bilgi yok
    - term: GTIN (normalize)
    - definition: Bilgi yok
    - term: SKU
    - definition: DEMO-002
    - term: Kategori
    - definition: Ev Otomasyonu
    - heading "Maliyet girdileri" [level=3]
    - paragraph: Fiyat önerileri bu girdiler + onaylı piyasa teklifleriyle hesaplanır.
    - term: Birim alış maliyeti
    - definition: ₺1.240,00
    - term: Giriş kargo / birim
    - definition: ₺20,00
    - term: Paketleme
    - definition: ₺5,00
    - term: Diğer sabit maliyet
    - definition: ₺3,00
    - heading "Piyasa araştırması" [level=3]
    - paragraph: DemoProvider anahtarsız çalışır; sonuçlar DEMO etiketli gelir.
    - button "Piyasayı Araştır"
    - paragraph: Bu ürün için henüz araştırma yapılmadı
    - paragraph: “Piyasayı Araştır” ile birebir ürün ve muadil teklifleri toplanır; eşleşmeleri onaylayıp fiyat analizine temel oluşturursunuz.
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
  25 |     await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });
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
> 62 |     await expect(page.getByText("Henüz fiyat geçmişi yok")).toBeVisible();
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  63 |     expect(consoleErrors).toEqual([]);
  64 |   });
  65 | });
  66 | 
```