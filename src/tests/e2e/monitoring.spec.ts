import { expect, test } from "@playwright/test";

test.describe("Faz 7 - izleme ve uyarılar", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("izleme sayfası örnek işi gösterir, duraklat/başlat çalışır", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/monitoring");

    await expect(page.getByText(/Kablosuz Kulaklık ANC Pro/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /İzlemeyi durdur|İzlemeyi başlat/ }).first()).toBeVisible();

    // Duraklat → durum rozeti "Duraklatıldı"
    await page.getByRole("button", { name: "İzlemeyi durdur" }).first().click();
    await expect(page.getByText("Duraklatıldı").first()).toBeVisible();

    // Tekrar başlat
    await page.getByRole("button", { name: "İzlemeyi başlat" }).first().click();
    await expect(page.getByText("Beklemede").first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("etkinlik akışı boş durum gösterir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/monitoring");
    await expect(page.getByText("Etkinlik yok")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("cron ucu yetkisiz çağrıda 401 döner", async ({ request }) => {
    const response = await request.get("/api/cron/monitoring");
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
