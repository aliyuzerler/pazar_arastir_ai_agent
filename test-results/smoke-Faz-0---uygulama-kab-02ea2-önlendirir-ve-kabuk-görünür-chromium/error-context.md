# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Faz 0 - uygulama kabuğu duman testi >> ana sayfa /dashboard'a yönlendirir ve kabuk görünür
- Location: src/tests/e2e/smoke.spec.ts:28:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 12

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
        - paragraph [ref=e61]: Genel Bakış
        - paragraph [ref=e62]: Product Intelligence
      - searchbox "Global ürün arama" [disabled] [ref=e67]
      - generic [ref=e68]:
        - generic [ref=e69]: "Kaynaklar: 1/4 hazır"
        - text: DEMO MOD
        - button "Yeni Araştırma" [ref=e70]
        - button "Koyu temaya geç" [ref=e72]
    - main [ref=e75]:
      - region "Genel Bakış" [ref=e77]:
        - generic [ref=e78]:
          - generic [ref=e79]:
            - heading "Genel Bakış" [level=1] [ref=e80]
            - paragraph [ref=e81]: Ürün ve araştırma verisi ekranları sonraki fazlarda aktifleşiyor.
          - text: DEMO MOD
        - generic "KPI şeridi" [ref=e82]:
          - generic [ref=e90]:
            - paragraph [ref=e91]: İzlenen ürün
            - paragraph [ref=e92]: —
          - generic [ref=e99]:
            - paragraph [ref=e100]: Bugünkü araştırma
            - paragraph [ref=e101]: —
          - generic [ref=e107]:
            - paragraph [ref=e108]: Fiyat değişimi sinyali
            - paragraph [ref=e109]: —
          - generic [ref=e116]:
            - paragraph [ref=e117]: Kaynak sağlığı
            - paragraph [ref=e118]: 1/4
        - generic [ref=e119]:
          - generic [ref=e120]:
            - generic [ref=e121]:
              - heading "Fiyat hareketi grafiği" [level=3] [ref=e122]
              - paragraph [ref=e123]: Faz 5’te gerçek fiyat gözlemleriyle çizilecek; uydurma veri gösterilmez.
            - generic [ref=e125]:
              - paragraph [ref=e128]: Grafik verisi yok
              - paragraph [ref=e129]: İlk başarılı fiyat gözleminden itibaren geçmiş burada oluşacak. Eksik günler araya çizgi eklenerek doldurulmaz.
          - generic [ref=e130]:
            - generic [ref=e132]:
              - heading "Kaynak durumları" [level=3] [ref=e133]
              - paragraph [ref=e134]: Sağlayıcı bağlantıları Faz 3’te yönetim ekranına taşınacak.
            - generic [ref=e139]:
              - generic [ref=e140]:
                - paragraph [ref=e142]: DemoProvider
                - generic [ref=e143]: Hazır (demo veri)
              - generic [ref=e147]:
                - paragraph [ref=e149]: DataForSEO · Google Shopping
                - generic [ref=e150]: Kurulmadı (anahtar yok)
              - generic [ref=e155]:
                - paragraph [ref=e157]: Keepa · Amazon
                - generic [ref=e158]: Kurulmadı
              - generic [ref=e163]:
                - paragraph [ref=e165]: SerpApi
                - generic [ref=e166]: Kurulmadı
              - paragraph [ref=e171]: Gerçek sağlayıcı anahtarı tanımlanana kadar araştırmalar yalnızca DemoProvider ile çalışır; demo sonuçları her ekranda etiketlenir.
        - generic [ref=e172]:
          - generic [ref=e173]:
            - generic [ref=e174]:
              - heading "Son araştırmalar" [level=3] [ref=e175]
              - paragraph [ref=e176]: Örnek kayıtlar — Faz 4’te gerçek veriyle değişecek.
            - text: DEMO VERİ
          - table [ref=e179]:
            - rowgroup [ref=e180]:
              - row [ref=e181]:
                - columnheader "Ürün" [ref=e182]
                - columnheader "Durum" [ref=e183]
                - columnheader "Kaynak" [ref=e184]
                - columnheader "Zaman" [ref=e185]
            - rowgroup [ref=e186]:
              - row [ref=e187]:
                - cell "Kablosuz Kulaklık ANC Pro — ÖRNEK KAYIT" [ref=e188]
                - cell "Tamamlandı" [ref=e189]
                - cell "DemoProvider" [ref=e194]
                - cell "2 saat önce" [ref=e195]
              - row [ref=e196]:
                - cell "Akıllı Ev Termostatı X1 — ÖRNEK KAYIT" [ref=e197]
                - cell "Kısmi sonuç" [ref=e198]
                - cell "DemoProvider" [ref=e202]
                - cell "Dün" [ref=e203]
              - row [ref=e204]:
                - cell "Portatif Projeksiyon Cihazı — ÖRNEK KAYIT" [ref=e205]
                - cell "Sonuç yok" [ref=e206]
                - cell "DemoProvider" [ref=e212]
                - cell "3 gün önce" [ref=e213]
        - generic [ref=e215]:
          - generic [ref=e219]:
            - paragraph [ref=e220]: İlk araştırmanızı başlatın
            - paragraph [ref=e221]: Ürün kataloğu Faz 2’de eklenecek. O zamana kadar bu panel yer tutucu verilerle gezinilebilir.
          - button "Ürünlere git" [disabled] [ref=e222]
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
> 34 |     expect(consoleErrors).toEqual([]);
     |                           ^ Error: expect(received).toEqual(expected) // deep equality
  35 |   });
  36 | 
  37 |   for (const route of ROUTES) {
  38 |     test(`rota ${route} konsol hatası olmadan açılır`, async ({ page }: { page: Page }) => {
  39 |       await page.goto(route);
  40 |       await expect(page.getByTestId("app-sidebar")).toBeVisible();
  41 |       expect(consoleErrors, `konsol hataları: ${consoleErrors.join(" | ")}`).toEqual([]);
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