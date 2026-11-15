# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: providers.spec.ts >> Faz 3 - veri kaynakları ekranı >> sağlayıcı durumları görüntülenir; anahtar değeri sızmaz
- Location: src/tests/e2e/providers.spec.ts:14:3

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
        - paragraph [ref=e61]: Veri Kaynakları
        - paragraph [ref=e62]: Product Intelligence
      - searchbox "Global ürün arama" [disabled] [ref=e67]
      - generic [ref=e68]:
        - generic [ref=e69]: "Kaynaklar: 1/4 hazır"
        - text: DEMO MOD
        - button "Yeni Araştırma" [ref=e70]
        - button "Koyu temaya geç" [ref=e72]
    - main [ref=e75]:
      - region "Veri Kaynakları" [ref=e77]:
        - generic [ref=e78]:
          - heading "Veri Kaynakları" [level=1] [ref=e79]
          - paragraph [ref=e80]: Anahtarlar yalnızca sunucu ortam değişkenlerinden okunur; bu ekranda gösterilmez ve istemciye gönderilmez.
        - table [ref=e83]:
          - rowgroup [ref=e84]:
            - row [ref=e85]:
              - columnheader "Sağlayıcı" [ref=e86]
              - columnheader "Durum" [ref=e87]
              - columnheader "Gerekli ortam değişkenleri" [ref=e88]
              - columnheader "Kapsam" [ref=e89]
          - rowgroup [ref=e90]:
            - row [ref=e91]:
              - cell [ref=e92]:
                - generic [ref=e98]:
                  - paragraph [ref=e99]: DemoProvider
                  - paragraph [ref=e100]: Demo veri sağlayıcı
              - cell [ref=e101]:
                - generic [ref=e102]: Hazır
                - text: DEMO
              - cell "—" [ref=e106]
              - cell "Anahtar kelimeGTIN aramaMPN aramaStok durumuStok adediKargo fiyatıGeçmiş fiyatSatıcı teklifleri" [ref=e107]
            - row [ref=e109]:
              - cell [ref=e110]:
                - generic [ref=e116]:
                  - paragraph [ref=e117]: DataForSEO · Google Shopping
                  - paragraph [ref=e118]: Canlı veri sağlayıcı
              - cell "Kurulmadı" [ref=e119]
              - cell "DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD" [ref=e124]
              - cell "Anahtar kelimeGTIN aramaDetay çekmeStok durumuSatıcı teklifleri" [ref=e125]
        - generic [ref=e127]:
          - generic [ref=e128]:
            - heading "Kapsam ve sorumluluk" [level=3] [ref=e129]
            - paragraph [ref=e130]: “Tüm pazar tarandı” iddiası yapılmaz; her sonuç kaynağına ve son kontrol zamanına bağlanır.
          - generic [ref=e131]:
            - paragraph [ref=e132]: DemoProvider sabit fixture verisiyle çalışır ve her ekranda DEMO etiketiyle işaretlenir. DataForSEO Google Shopping adaptörü, anahtar tanımlandığında canlı arama için hazır hale gelir; anahtar yoksa hiçbir canlı çağrı yapılmaz.
            - paragraph [ref=e133]: Yetkisiz scraping, bot koruması atlatma ve gizli API taklidi bu projede bilinçli olarak uygulanmaz (docs/04 §7).
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test.describe("Faz 3 - veri kaynakları ekranı", () => {
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
  14 |   test("sağlayıcı durumları görüntülenir; anahtar değeri sızmaz", async ({ page }) => {
  15 |     await page.setViewportSize({ width: 1440, height: 900 });
  16 |     await page.goto("/data-sources");
  17 | 
  18 |     await expect(page.getByText("DemoProvider", { exact: true })).toBeVisible();
  19 |     await expect(page.getByText("Hazır").first()).toBeVisible();
  20 |     await expect(page.getByText("DEMO").first()).toBeVisible();
  21 |     await expect(page.getByText("DataForSEO · Google Shopping")).toBeVisible();
  22 |     await expect(page.getByText("Kurulmadı").first()).toBeVisible();
  23 | 
  24 |     // Gerekli env değişkeni ADI gösterilebilir; API key DEĞERİ sızamaz.
  25 |     await expect(page.getByText("DATAFORSEO_LOGIN")).toBeVisible();
  26 |     const html = await page.content();
  27 |     expect(html).not.toMatch(/Bearer\s+[A-Za-z0-9-]{20,}/);
> 28 |     expect(consoleErrors).toEqual([]);
     |                           ^ Error: expect(received).toEqual(expected) // deep equality
  29 |   });
  30 | 
  31 |   test("providers API sözleşmeye uygun döner", async ({ request }) => {
  32 |     const response = await request.get("/api/providers");
  33 |     expect(response.status()).toBe(200);
  34 |     const body = await response.json();
  35 |     const ids = body.data.providers.map((p: { id: string }) => p.id);
  36 |     expect(ids).toContain("demo");
  37 |     expect(ids).toContain("dataforseo");
  38 |     const demo = body.data.providers.find((p: { id: string }) => p.id === "demo");
  39 |     expect(demo.isDemo).toBe(true);
  40 |     expect(demo.capabilities.gtinSearch).toBe(true);
  41 |     // Zarf kontrolleri
  42 |     expect(body.error).toBeNull();
  43 |     expect(body.meta.requestId).toBeTruthy();
  44 |   });
  45 | });
  46 | 
```