import { expect, test } from "@playwright/test";

test.describe("Faz 8 - ayarlar ve release gate", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("ayarlar sayfası workspace, mod ve kapı listesini gösterir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Ayarlar" })).toBeVisible();
    await expect(page.getByText("Default Workspace")).toBeVisible();
    await expect(page.getByText("YEREL MOD", { exact: true })).toBeVisible();
    await expect(page.getByText("SaaS yayın kapısı (release gate)")).toBeVisible();
    // Kapı öğeleri: auth bekliyor, DB yerel parola, CRON_SECRET, PROD_READY
    await expect(page.getByText("Kimlik doğrulama / oturum yönetimi")).toBeVisible();
    await expect(page.getByText("PROD_READY=true (bilinçli onay)")).toBeVisible();
    // Secret DEĞERİ sızamaz
    const html = await page.content();
    expect(html).not.toContain("productintel_local_password");
    expect(consoleErrors).toEqual([]);
  });
});
