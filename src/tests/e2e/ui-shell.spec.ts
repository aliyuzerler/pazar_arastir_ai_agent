import { expect, test, type Page } from "@playwright/test";

/**
 * TEST_01: tema kalıcılığı, mobil menü, klavye erişimi ve aktif gezinme.
 */
test.describe("Faz 1 - UI shell davranışları", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("tema düğmesi koyu temaya geçirir ve tercih yenileme sonrası korunur", async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const stored = await page.evaluate(() => window.localStorage.getItem("pi-theme"));
    expect(stored).toBe("dark");
    expect(consoleErrors).toEqual([]);
  });

  test("mobil görünümde menü düğmesi çekmeceyi açar ve gezinme çalışır", async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.getByTestId("app-sidebar")).toBeHidden();
    await page.getByTestId("mobile-menu-button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "Ürünler" }).click();
    await expect(page).toHaveURL(/\/products/);
    expect(consoleErrors).toEqual([]);
  });

  test("klavye ile menü bağlantıları arasında geçilebilir ve odak görünür", async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await page.keyboard.press("Tab");
    const firstLink = page.getByRole("link", { name: "Genel Bakış" });
    await expect(firstLink).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Ürünler" })).toBeFocused();
  });

  test("aktif menü öğesi aria-current ile işaretlenir", async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/pricing-analysis");
    const active = page.locator('a[aria-current="page"]');
    await expect(active).toHaveText(/Fiyat Analizi/);
  });

  test("dashboard örnek verileri DEMO etiketiyle görünür", async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await expect(page.getByText("DEMO VERİ").first()).toBeVisible();
    await expect(page.getByTestId("provider-health")).toContainText("1/4 hazır");
  });
});
