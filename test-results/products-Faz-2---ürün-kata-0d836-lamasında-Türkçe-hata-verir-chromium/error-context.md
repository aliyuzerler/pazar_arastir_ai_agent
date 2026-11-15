# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: products.spec.ts >> Faz 2 - ürün kataloğu yolculuğu >> boş başlık ve hatalı GTIN sunucu doğrulamasında Türkçe hata verir
- Location: src/tests/e2e/products.spec.ts:22:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Ürün başlığı zorunludur.')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Ürün başlığı zorunludur.') with timeout 10000ms
  - waiting for getByText('Ürün başlığı zorunludur.')

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
  - region "Ürün Ekle":
    - heading "Ürün Ekle" [level=1]
    - paragraph: Ürün kimliği ve maliyet girdilerini girin. Piyasa araştırması sonraki adımda ürün detayından başlatılır.
    - heading "Ürün kimliği" [level=3]
    - paragraph: Zorunlu alanlar * ile işaretlidir.
    - text: Ürün başlığı
    - textbox "Ürün başlığı"
    - text: SKU (stok kodu)
    - textbox "SKU (stok kodu)"
    - text: GTIN / EAN / UPC
    - textbox "GTIN / EAN / UPC":
      - /placeholder: "8690000000000"
    - text: Marka
    - textbox "Marka"
    - text: Model
    - textbox "Model"
    - text: MPN (üretici kodu)
    - textbox "MPN (üretici kodu)"
    - text: Kategori
    - textbox "Kategori":
      - /placeholder: Elektronik / Ses Sistemleri
    - text: Açıklama
    - textbox "Açıklama"
    - text: Ürün URL (https)
    - textbox "Ürün URL (https)"
    - text: Görsel URL (https)
    - textbox "Görsel URL (https)"
    - heading "Maliyet girdileri" [level=3]
    - paragraph: Birim maliyet ve sabit giderler fiyat öneri motorunda (Faz 6) kullanılır.
    - text: Birim alış maliyeti
    - textbox "Birim alış maliyeti":
      - /placeholder: "850.00"
    - text: Para birimi
    - combobox "Para birimi":
      - option "TRY" [selected]
      - option "USD"
      - option "EUR"
      - option "GBP"
    - text: Giriş kargo / birim
    - textbox "Giriş kargo / birim": "0"
    - text: Paketleme maliyeti
    - textbox "Paketleme maliyeti": "0"
    - text: Diğer sabit maliyet
    - textbox "Diğer sabit maliyet": "0"
    - heading "Ürün özellikleri" [level=3]
    - paragraph: Renk, kapasite, paket adedi gibi varyant bilgileri.
    - button "Özellik ekle"
    - paragraph: Henüz özellik eklenmedi.
    - button "Ürünü kaydet"
    - button "Vazgeç"
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * TEST_02: ürün oluşturma, doğrulama hataları, liste ve CSV içe aktarma.
  5   |  */
  6   | test.describe("Faz 2 - ürün kataloğu yolculuğu", () => {
  7   |   let consoleErrors: string[] = [];
  8   | 
  9   |   test.beforeEach(({ page }) => {
  10  |     consoleErrors = [];
  11  |     page.on("console", (message) => {
  12  |       if (message.type() === "error") consoleErrors.push(message.text());
  13  |     });
  14  |     page.on("pageerror", (error) => consoleErrors.push(String(error)));
  15  |   });
  16  | 
  17  |   async function openNewProductForm(page: Page) {
  18  |     await page.goto("/products/new");
  19  |     await expect(page.getByRole("heading", { name: "Ürün Ekle" })).toBeVisible();
  20  |   }
  21  | 
  22  |   test("boş başlık ve hatalı GTIN sunucu doğrulamasında Türkçe hata verir", async ({
  23  |     page,
  24  |   }: {
  25  |     page: Page;
  26  |   }) => {
  27  |     await page.setViewportSize({ width: 1440, height: 900 });
  28  |     await openNewProductForm(page);
  29  |     await page.getByLabel("Ürün başlığı").fill("");
  30  |     await page.getByLabel("Birim alış maliyeti").fill("100");
  31  |     await page.getByLabel("GTIN / EAN / UPC").fill("1234567890123");
  32  |     await page.getByRole("button", { name: "Ürünü kaydet" }).click();
> 33  |     await expect(page.getByText("Ürün başlığı zorunludur.")).toBeVisible();
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  34  |     await expect(page.getByText(/GTIN geçersiz/)).toBeVisible();
  35  |   });
  36  | 
  37  |   test("geçerli ürün oluşturulur, listede görünür, arşivlenir", async ({ page }: { page: Page }) => {
  38  |     test.setTimeout(60_000);
  39  |     await page.setViewportSize({ width: 1440, height: 900 });
  40  |     await openNewProductForm(page);
  41  | 
  42  |     const suffix = Date.now().toString().slice(-6);
  43  |     await page.getByLabel("Ürün başlığı").fill(`E2E Test Ürünü ${suffix}`);
  44  |     await page.getByLabel("SKU (stok kodu)").fill(`E2E-${suffix}`);
  45  |     await page.getByLabel("GTIN / EAN / UPC").fill("8690000000036");
  46  |     await page.getByLabel("Marka").fill("TestMark");
  47  |     await page.getByLabel("Birim alış maliyeti").fill("425.50");
  48  |     await page.getByRole("button", { name: "Ürünü kaydet" }).click();
  49  | 
  50  |     // Detay sayfasına yönlendirilir
  51  |     await expect(page.getByRole("heading", { name: `E2E Test Ürünü ${suffix}` })).toBeVisible();
  52  |     await expect(page.getByText("₺425,50").first()).toBeVisible();
  53  | 
  54  |     // Listede ara
  55  |     await page.goto("/products");
  56  |     await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill(`E2E-${suffix}`);
  57  |     await page.getByRole("button", { name: "Filtrele" }).click();
  58  |     await expect(page.getByRole("link", { name: `E2E Test Ürünü ${suffix}` })).toBeVisible();
  59  | 
  60  |     // Arşivle: PATCH yanıtını bekle, satır aktif listeden kaybolur,
  61  |     // arşiv görünümünde geri yüklenebilir.
  62  |     const patchResponse = page.waitForResponse(
  63  |       (response) =>
  64  |         response.request().method() === "PATCH" && response.url().includes("/api/products/"),
  65  |     );
  66  |     await page.getByRole("button", { name: "Arşivle" }).click();
  67  |     const response = await patchResponse;
  68  |     expect(response.status()).toBe(200);
  69  |     await page.goto("/products?archived=true");
  70  |     await expect(page.getByRole("link", { name: `E2E Test Ürünü ${suffix}` })).toBeVisible();
  71  |     await expect(page.getByRole("button", { name: "Geri yükle" }).first()).toBeVisible();
  72  |     expect(consoleErrors).toEqual([]);
  73  |   });
  74  | 
  75  |   test("CSV önizleme hatalı satırları işaretler ve içe aktarma çalışır", async ({
  76  |     page,
  77  |   }: {
  78  |     page: Page;
  79  |   }) => {
  80  |     test.setTimeout(60_000);
  81  |     await page.setViewportSize({ width: 1440, height: 900 });
  82  |     await page.goto("/products/import");
  83  | 
  84  |     const suffix = Date.now().toString().slice(-6);
  85  |     const csv = [
  86  |       "title,sku,gtin,unit_cost,currency",
  87  |       `CSV Ürün A ${suffix},CSVA-${suffix},,199.90,TRY`,
  88  |       "Hatalı Satır,,,abc,TRY",
  89  |     ].join("\n");
  90  |     await page.getByLabel("CSV içeriği").fill(csv);
  91  |     await page.getByRole("button", { name: "Önizle" }).click();
  92  | 
  93  |     await expect(page.getByText(/2 satır · 1 geçerli · 1 hatalı/)).toBeVisible();
  94  |     await expect(page.getByText("unitCost: Geçerli bir sayı girin")).toBeVisible();
  95  | 
  96  |     await page.getByRole("button", { name: /İçe Aktar \(1 geçerli satır\)/ }).click();
  97  |     await expect(page.getByText(/1 ürün içe aktarıldı, 1 satır atlandı/)).toBeVisible();
  98  | 
  99  |     // İçe aktarılan ürün listede
  100 |     await page.goto("/products");
  101 |     await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill(`CSVA-${suffix}`);
  102 |     await page.getByRole("button", { name: "Filtrele" }).click();
  103 |     await expect(page.getByRole("link", { name: `CSV Ürün A ${suffix}` })).toBeVisible();
  104 |     expect(consoleErrors).toEqual([]);
  105 |   });
  106 | 
  107 |   test("mobil görünümde ürün formu kullanılabilir", async ({ page }: { page: Page }) => {
  108 |     await page.setViewportSize({ width: 390, height: 844 });
  109 |     await page.goto("/products/new");
  110 |     await expect(page.getByLabel("Ürün başlığı")).toBeVisible();
  111 |     await expect(page.getByRole("button", { name: "Ürünü kaydet" })).toBeVisible();
  112 |     // Yatay taşma yok
  113 |     const overflow = await page.evaluate(
  114 |       () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  115 |     );
  116 |     expect(overflow).toBeLessThanOrEqual(1);
  117 |   });
  118 | });
  119 | 
```