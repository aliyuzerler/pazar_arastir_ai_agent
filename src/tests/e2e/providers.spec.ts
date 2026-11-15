import { expect, test } from "@playwright/test";

test.describe("Faz 3 - veri kaynakları ekranı", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("sağlayıcı durumları görüntülenir; anahtar değeri sızmaz", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/data-sources");

    await expect(page.getByText("DemoProvider", { exact: true })).toBeVisible();
    await expect(page.getByText("Hazır").first()).toBeVisible();
    await expect(page.getByText("DEMO").first()).toBeVisible();
    await expect(page.getByText("DataForSEO · Google Shopping")).toBeVisible();
    await expect(page.getByText("Kurulmadı").first()).toBeVisible();

    // Gerekli env değişkeni ADI gösterilebilir; API key DEĞERİ sızamaz.
    await expect(page.getByText("DATAFORSEO_LOGIN")).toBeVisible();
    const html = await page.content();
    expect(html).not.toMatch(/Bearer\s+[A-Za-z0-9-]{20,}/);
    expect(consoleErrors).toEqual([]);
  });

  test("providers API sözleşmeye uygun döner", async ({ request }) => {
    const response = await request.get("/api/providers");
    expect(response.status()).toBe(200);
    const body = await response.json();
    const ids = body.data.providers.map((p: { id: string }) => p.id);
    expect(ids).toContain("demo");
    expect(ids).toContain("dataforseo");
    const demo = body.data.providers.find((p: { id: string }) => p.id === "demo");
    expect(demo.isDemo).toBe(true);
    expect(demo.capabilities.gtinSearch).toBe(true);
    // Zarf kontrolleri
    expect(body.error).toBeNull();
    expect(body.meta.requestId).toBeTruthy();
  });
});
