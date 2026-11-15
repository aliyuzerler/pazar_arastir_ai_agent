# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-shell.spec.ts >> Faz 1 - UI shell davranışları >> tema düğmesi koyu temaya geçirir ve tercih yenileme sonrası korunur
- Location: src/tests/e2e/ui-shell.spec.ts:17:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('html')
Expected pattern: /dark/
Received string:  ""
Timeout: 10000ms

Call log:
  - Expect "toHaveClass" locator('html') with timeout 10000ms
  - waiting for locator('html')
    24 × locator resolved to <html lang="tr">…</html>
       - unexpected value ""

```

```yaml
- document:
  - complementary
  - banner
  - main
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * TEST_01: tema kalıcılığı, mobil menü, klavye erişimi ve aktif gezinme.
  5  |  */
  6  | test.describe("Faz 1 - UI shell davranışları", () => {
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
  17 |   test("tema düğmesi koyu temaya geçirir ve tercih yenileme sonrası korunur", async ({ page }: { page: Page }) => {
  18 |     await page.setViewportSize({ width: 1440, height: 900 });
  19 |     await page.goto("/dashboard");
  20 |     await page.getByTestId("theme-toggle").click();
> 21 |     await expect(page.locator("html")).toHaveClass(/dark/);
     |                                        ^ Error: expect(locator).toHaveClass(expected) failed
  22 |     await page.reload();
  23 |     await expect(page.locator("html")).toHaveClass(/dark/);
  24 |     const stored = await page.evaluate(() => window.localStorage.getItem("pi-theme"));
  25 |     expect(stored).toBe("dark");
  26 |     expect(consoleErrors).toEqual([]);
  27 |   });
  28 | 
  29 |   test("mobil görünümde menü düğmesi çekmeceyi açar ve gezinme çalışır", async ({ page }: { page: Page }) => {
  30 |     await page.setViewportSize({ width: 390, height: 844 });
  31 |     await page.goto("/dashboard");
  32 |     await expect(page.getByTestId("app-sidebar")).toBeHidden();
  33 |     await page.getByTestId("mobile-menu-button").click();
  34 |     const dialog = page.getByRole("dialog");
  35 |     await expect(dialog).toBeVisible();
  36 |     await dialog.getByRole("link", { name: "Ürünler" }).click();
  37 |     await expect(page).toHaveURL(/\/products/);
  38 |     expect(consoleErrors).toEqual([]);
  39 |   });
  40 | 
  41 |   test("klavye ile menü bağlantıları arasında geçilebilir ve odak görünür", async ({ page }: { page: Page }) => {
  42 |     await page.setViewportSize({ width: 1440, height: 900 });
  43 |     await page.goto("/dashboard");
  44 |     await page.keyboard.press("Tab");
  45 |     const firstLink = page.getByRole("link", { name: "Genel Bakış" });
  46 |     await expect(firstLink).toBeFocused();
  47 |     await page.keyboard.press("Tab");
  48 |     await expect(page.getByRole("link", { name: "Ürünler" })).toBeFocused();
  49 |   });
  50 | 
  51 |   test("aktif menü öğesi aria-current ile işaretlenir", async ({ page }: { page: Page }) => {
  52 |     await page.setViewportSize({ width: 1440, height: 900 });
  53 |     await page.goto("/pricing-analysis");
  54 |     const active = page.locator('a[aria-current="page"]');
  55 |     await expect(active).toHaveText(/Fiyat Analizi/);
  56 |   });
  57 | 
  58 |   test("dashboard örnek verileri DEMO etiketiyle görünür", async ({ page }: { page: Page }) => {
  59 |     await page.setViewportSize({ width: 1440, height: 900 });
  60 |     await page.goto("/dashboard");
  61 |     await expect(page.getByText("DEMO VERİ").first()).toBeVisible();
  62 |     await expect(page.getByTestId("provider-health")).toContainText("1/4 hazır");
  63 |   });
  64 | });
  65 | 
```