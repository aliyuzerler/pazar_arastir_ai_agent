/**
 * Üretim başlangıç kapısı (deployment gate).
 *
 * APP_MODE=production iken:
 * - Varsayılan yerel veritabanı parolası KABUL EDİLMEZ.
 * - CRON_SECRET zorunludur (varsayılan değer kabul edilmez).
 * - PROD_READY=true yoksa sunucu kasıtlı olarak başlamaz; auth olmadan
 *   public deployment yapılacağı açıkça engellenir (AGENTS.md §4).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.APP_MODE !== "production") return;

  const problems: string[] = [];

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (dbUrl.includes("productintel_local_password")) {
    problems.push("DATABASE_URL varsayılan yerel parolayı içeriyor; üretimde yönetilen PostgreSQL kullanılmalıdır.");
  }
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET === "change-this-to-a-long-random-secret") {
    problems.push("CRON_SECRET üretim için zorunludur ve varsayılan değer kabul edilmez.");
  }
  if (process.env.PROD_READY !== "true") {
    problems.push(
      "PROD_READY=true olmadan üretim başlatılmaz: auth (Faz 10-12) eklendi; onay yine de bilinçli adım olarak zorunludur (release gate).",
    );
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "dev-session-secret-change-me") {
    problems.push("SESSION_SECRET üretim için zorunludur ve geliştirme değeri kabul edilmez.");
  }

  if (problems.length > 0) {
    throw new Error(
      "[deployment gate] Üretim başlatma engellendi:\n- " + problems.join("\n- "),
    );
  }
  console.log("[instrumentation] Üretim kapısı geçildi; uygulama başlatılıyor.");
}
