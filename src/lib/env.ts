/**
 * Ortam değişkeni doğrulama (yalnızca sunucu tarafında kullanılmalı).
 *
 * Kurallar:
 * - Hata mesajları yalnızca alan adlarını içerir; secret değerleri asla yazdırılmaz.
 * - DB_DRIVER=postgres seçiliyken DATABASE_URL zorunludur.
 * - DB_DRIVER=pglite gömülü PostgreSQL (WASM) çalıştırır; testler ve
 *   Docker'ın olmadığı ortamlar içindir. Üretimde kullanılmaz.
 */
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["local", "production"]).default("local"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),

  // PostgreSQL (docker-compose yerel varsayılan). Değer gizli kabul edilir,
  // hatalarda asla yazdırılmaz.
  DATABASE_URL: z
    .string()
    .default("postgresql://productintel:productintel_local_password@localhost:5432/product_intelligence"),
  DB_DRIVER: z.enum(["postgres", "pglite"]).default("postgres"),
  PG_LITE_DATA_DIR: z.string().default("./.pglite-data"),

  DEFAULT_WORKSPACE_SLUG: z.string().min(1).default("default"),
  DEFAULT_COUNTRY: z.string().length(2).default("TR"),
  DEFAULT_LOCALE: z.string().min(2).default("tr-TR"),
  DEFAULT_CURRENCY: z.string().length(3).default("TRY"),

  // Sağlayıcı seçimi ve anahtarları (yalnızca sunucu tarafı)
  PROVIDER_MODE: z.enum(["demo", "live"]).default("demo"),
  DATAFORSEO_LOGIN: z.string().optional(),
  DATAFORSEO_PASSWORD: z.string().optional(),
  SERPAPI_API_KEY: z.string().optional(),
  KEEPA_API_KEY: z.string().optional(),
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),

  // Opsiyonel AI yardımcısı (yalnızca sunucu tarafı)
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),

  // Zamanlanmış işler
  CRON_SECRET: z.string().optional(),
  MAX_DAILY_QUERIES: z.coerce.number().int().min(1).max(100000).default(200),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

/** Testlerde önbelleği sıfırlamak için. */
export function resetEnvCache(): void {
  cachedEnv = null;
}

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Yalnızca alan adlarını raporla; değerleri asla yazdırma.
    const fields = parsed.error.issues.map((issue) => issue.path.join(".") || "(kök)").join(", ");
    throw new Error(
      `Geçersiz ortam değişkenleri. Şu alanlar eksik veya hatalı: ${fields}. ` +
        "Lütfen .env dosyanızı .env.example ile karşılaştırın.",
    );
  }

  const env = parsed.data;
  if (env.DB_DRIVER === "postgres" && !env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL zorunludur (DB_DRIVER=postgres). " +
        "Docker'sız ortamlarda DB_DRIVER=pglite kullanabilirsiniz.",
    );
  }

  cachedEnv = env;
  return env;
}
