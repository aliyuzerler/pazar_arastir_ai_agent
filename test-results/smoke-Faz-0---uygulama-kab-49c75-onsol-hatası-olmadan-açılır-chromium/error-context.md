# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Faz 0 - uygulama kabuğu duman testi >> rota /products konsol hatası olmadan açılır
- Location: src/tests/e2e/smoke.spec.ts:38:5

# Error details

```
Error: konsol hataları: Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request)

expect(received).toEqual(expected) // deep equality

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
        - paragraph [ref=e61]: Ürünler
        - paragraph [ref=e62]: Product Intelligence
      - searchbox "Global ürün arama" [disabled] [ref=e67]
      - generic [ref=e68]:
        - generic [ref=e69]: "Kaynaklar: 1/4 hazır"
        - text: DEMO MOD
        - button "Yeni Araştırma" [ref=e70]
        - button "Koyu temaya geç" [ref=e72]
    - main [ref=e75]:
      - region "Ürünler" [ref=e77]:
        - generic [ref=e78]:
          - generic [ref=e79]:
            - heading "Ürünler" [level=1] [ref=e80]
            - paragraph [ref=e81]: 3 kayıt · kendi kataloğunuz (rakip teklifleri ayrı tutulur)
          - generic [ref=e82]:
            - link [ref=e83] [cursor=pointer]:
              - /url: /products/import
              - button "CSV İçe Aktar" [ref=e84]
            - link [ref=e88] [cursor=pointer]:
              - /url: /products/new
              - button "Ürün Ekle" [ref=e89]
        - form "Ürün filtreleri" [ref=e91]:
          - generic [ref=e92]:
            - text: Ara (başlık, marka, SKU, GTIN)
            - textbox "Ara (başlık, marka, SKU, GTIN)" [ref=e93]:
              - /placeholder: örn. kulaklık
          - generic [ref=e94]:
            - text: Kategori
            - textbox "Kategori" [ref=e95]
          - generic [ref=e96]:
            - text: İzleme
            - combobox "İzleme" [ref=e97]:
              - option "Tümü" [selected]
              - option "İzleniyor"
              - option "İzlenmiyor"
          - generic [ref=e98]:
            - text: Sıralama
            - combobox "Sıralama" [ref=e99]:
              - option "En yeni" [selected]
              - option "Başlık (A-Z)"
              - option "Maliyet (yüksek)"
              - option "Maliyet (düşük)"
          - button "Filtrele" [ref=e100]
          - link [ref=e101] [cursor=pointer]:
            - /url: /products?archived=true
            - button "Arşiv" [ref=e102]
        - table [ref=e108]:
          - rowgroup [ref=e109]:
            - row [ref=e110]:
              - columnheader "Ürün" [ref=e111]
              - columnheader "SKU / GTIN" [ref=e112]
              - columnheader "Birim maliyet" [ref=e113]
              - columnheader "Son güncelleme" [ref=e114]
              - columnheader "İşlem" [ref=e115]
          - rowgroup [ref=e116]:
            - row [ref=e117]:
              - cell [ref=e118]:
                - link "Portatif Projeksiyon Cihazı MiniBeam" [ref=e119] [cursor=pointer]:
                  - /url: /products/40eebd95-73c1-4065-8e85-ec4e34ff2f91
                - paragraph [ref=e120]: GörüMark · MiniBeam-200
              - cell "DEMO-003 / 8690000000029" [ref=e121]
              - cell "₺2.150,00" [ref=e122]
              - cell "15 Kas 2026 19:53" [ref=e123]
              - cell [ref=e124]:
                - button "Arşivle" [ref=e125]
            - row [ref=e126]:
              - cell [ref=e127]:
                - link "Akıllı Ev Termostatı X1" [ref=e128] [cursor=pointer]:
                  - /url: /products/973d8758-f4a5-4008-a295-d8240db4aa7b
                - paragraph [ref=e129]: EvMark · X1
              - cell "DEMO-002" [ref=e130]
              - cell "₺1.240,00" [ref=e131]
              - cell "15 Kas 2026 19:53" [ref=e132]
              - cell [ref=e133]:
                - button "Arşivle" [ref=e134]
            - row [ref=e135]:
              - cell [ref=e136]:
                - link "Kablosuz Kulaklık ANC Pro" [ref=e137] [cursor=pointer]:
                  - /url: /products/a5ed93fb-48f4-4bb4-b9ed-777dedeb8d0b
                - paragraph [ref=e138]: SesMark · ANC-Pİzleniyor
              - cell "DEMO-001 / 8690000000012" [ref=e139]
              - cell "₺850,00" [ref=e140]
              - cell "15 Kas 2026 19:53" [ref=e141]
              - cell [ref=e142]:
                - button "Arşivle" [ref=e143]
        - navigation "Sayfalama" [ref=e144]:
          - paragraph [ref=e145]: Sayfa 1 / 1 · 3 kayıt
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | const ROUTES = [
  4  |   "/dashboard",
  5  |   "/products",
  6  |   "/research",
  7  |   "/monitoring",
  8  |   "/pricing-analysis",
  9  |   "/data-sources",
  10 |   "/settings",
  11 | ];
  12 | 
  13 | /**
  14 |  * TEST_00 md-8: Playwright uygulama kabuğunu ve gezinme rotalarını
  15 |  * konsol hatası olmadan açabilmeli.
  16 |  */
  17 | test.describe("Faz 0 - uygulama kabuğu duman testi", () => {
  18 |   let consoleErrors: string[] = [];
  19 | 
  20 |   test.beforeEach(({ page }) => {
  21 |     consoleErrors = [];
  22 |     page.on("console", (message) => {
  23 |       if (message.type() === "error") consoleErrors.push(message.text());
  24 |     });
  25 |     page.on("pageerror", (error) => consoleErrors.push(String(error)));
  26 |   });
  27 | 
  28 |   test("ana sayfa /dashboard'a yönlendirir ve kabuk görünür", async ({ page }: { page: Page }) => {
  29 |     await page.goto("/");
  30 |     await expect(page).toHaveURL(/\/dashboard/);
  31 |     await expect(page.getByTestId("app-sidebar")).toBeVisible();
  32 |     await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();
  33 |     await expect(page.getByTestId("kpi-strip")).toBeVisible();
  34 |     expect(consoleErrors).toEqual([]);
  35 |   });
  36 | 
  37 |   for (const route of ROUTES) {
  38 |     test(`rota ${route} konsol hatası olmadan açılır`, async ({ page }: { page: Page }) => {
  39 |       await page.goto(route);
  40 |       await expect(page.getByTestId("app-sidebar")).toBeVisible();
> 41 |       expect(consoleErrors, `konsol hataları: ${consoleErrors.join(" | ")}`).toEqual([]);
     |                                                                              ^ Error: konsol hataları: Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request)
  42 |     });
  43 |   }
  44 | 
  45 |   test("health API healthy döner", async ({ request }) => {
  46 |     const response = await request.get("/api/health");
  47 |     expect(response.status()).toBe(200);
  48 |     const body = await response.json();
  49 |     expect(body.data.status).toBe("healthy");
  50 |     expect(body.data.database.status).toBe("healthy");
  51 |     expect(body.error).toBeNull();
  52 |     expect(body.meta.requestId).toBeTruthy();
  53 |   });
  54 | });
  55 | 
```