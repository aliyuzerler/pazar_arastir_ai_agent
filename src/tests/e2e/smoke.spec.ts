import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/dashboard",
  "/products",
  "/research",
  "/monitoring",
  "/pricing-analysis",
  "/data-sources",
  "/settings",
];

/**
 * TEST_00 md-8: Playwright uygulama kabuğunu ve gezinme rotalarını
 * konsol hatası olmadan açabilmeli.
 */
test.describe("Faz 0 - uygulama kabuğu duman testi", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("ana sayfa /dashboard'a yönlendirir ve kabuk görünür", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();
    await expect(page.getByTestId("kpi-strip")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  for (const route of ROUTES) {
    test(`rota ${route} konsol hatası olmadan açılır`, async ({ page }: { page: Page }) => {
      await page.goto(route);
      await expect(page.getByTestId("app-sidebar")).toBeVisible();
      expect(consoleErrors, `konsol hataları: ${consoleErrors.join(" | ")}`).toEqual([]);
    });
  }

  test("health API healthy döner", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe("healthy");
    expect(body.data.database.status).toBe("healthy");
    expect(body.error).toBeNull();
    expect(body.meta.requestId).toBeTruthy();
  });
});
