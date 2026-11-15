import { expect, test } from "@playwright/test";

/** Auth sayfaları oturum durumu OLMADAN test edilir.
 *  Not: undefined proje değerini geçersiz kılmaz; boş durum gerekir. */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Faz 10 - kimlik doğrulama", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("korumalı sayfaya oturumsuz giriş /login'e yönlendirir ve next parametresi taşınır", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  });

  test("korunan API oturumsuz 401 döner", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("kayıt → demo doğrulama bağlantısı → giriş akışı", async ({ page }) => {
    test.setTimeout(90_000);
    const email = `uye${Date.now().toString().slice(-6)}@test.local`;

    await page.goto("/register");
    await page.getByLabel("Ad soyad").fill("Test Üyesi");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("TestParola123");
    await page.getByRole("button", { name: "Hesap oluştur" }).click();

    await expect(page.getByTestId("register-success")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("E-postanı kontrol et")).toBeVisible();

    // Yerel modda doğrulama bağlantısı DEMO kutusunda gösterilir
    const demoLink = page.getByTestId("demo-verification").getByRole("link");
    await demoLink.click();

    await expect(page.getByText(/doğrulandı|E-posta adresin doğrulandı/i)).toBeVisible({ timeout: 15_000 });

    await page.goto("/login");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("TestParola123");
    await page.getByRole("button", { name: "Giriş yap" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("yanlış parola hatası gösterilir, zayıf parola kaydı reddedilir", async ({ page }) => {
    // Negatif akışlarda 4xx yanıtlarının "Failed to load resource" kayıtları
    // tarayıcı gürültüsüdür; gerçek JS hatalarını süzüyoruz. Aşağıda: 
    await page.goto("/register");
    await page.getByLabel("Ad soyad").fill("Zayıf Üye");
    await page.getByLabel("E-posta").fill(`zayif${Date.now().toString().slice(-5)}@test.local`);
    await page.getByLabel("Parola").fill("gizli");
    await page.getByRole("button", { name: "Hesap oluştur" }).click();
    await expect(page.getByText(/en az/i).first()).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("E-posta").fill("admin@demo.local");
    await page.getByLabel("Parola").fill("YanlisParola1");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page.getByText("E-posta veya parola hatalı.")).toBeVisible();
    const jsErrors = consoleErrors.filter((entry) => !entry.startsWith("Failed to load resource"));
    expect(jsErrors).toEqual([]);
  });

  test("oturumlu kullanıcı çıkış yapabilir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // Bu dosyada oturum durumu boştur; önce UI ile giriş yapılır.
    await page.goto("/login");
    await page.getByLabel("E-posta").fill("admin@demo.local");
    await page.getByLabel("Parola").fill("Demo!23456");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await page.getByRole("button", { name: "Çıkış yap" }).click();
    await expect(page).toHaveURL(/\/login/);
    // Not: çıkış anında eski sayfanın bekleyen istekleri 401 döndürebilir;
    // bu beklenen davranış olduğu için konsol iddiası burada uygulanmaz.
  });
});
