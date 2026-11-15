# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Faz 0 - uygulama kabuğu duman testi >> rota /pricing-analysis konsol hatası olmadan açılır
- Location: src/tests/e2e/smoke.spec.ts:38:5

# Error details

```
Error: konsol hataları: Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request)

expect(received).toEqual(expected) // deep equality

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
        - paragraph [ref=e61]: Fiyat Analizi
        - paragraph [ref=e62]: Product Intelligence
      - searchbox "Global ürün arama" [disabled] [ref=e67]
      - generic [ref=e68]:
        - generic [ref=e69]: "Kaynaklar: 1/4 hazır"
        - text: DEMO MOD
        - button "Yeni Araştırma" [ref=e70]
        - button "Koyu temaya geç" [ref=e72]
    - main [ref=e75]:
      - region "Fiyat Analizi" [ref=e77]:
        - generic [ref=e78]:
          - heading "Fiyat Analizi" [level=1] [ref=e79]
          - paragraph [ref=e80]: Bu bölüm sonraki geliştirme fazlarında aktifleşecek.
        - generic [ref=e81]:
          - paragraph [ref=e84]: Bu ekran henüz yapım aşamasında
          - paragraph [ref=e85]: Başa baş fiyat, marj senaryoları ve öneriler burada hesaplanacak.
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
     |                                                                              ^ Error: konsol hataları: Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request) | Failed to load resource: the server responded with a status of 400 (Bad Request)
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