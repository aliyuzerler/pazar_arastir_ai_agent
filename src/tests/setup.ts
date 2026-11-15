/**
 * Vitest ortak kurulumu. Testler her zaman ayrı bir pglite veri dizininde
 * çalışır; .env içindeki PG_LITE_DATA_DIR ezer (izolasyon).
 */
import "@testing-library/jest-dom/vitest";
import "dotenv/config";

process.env.DB_DRIVER = "pglite";
process.env.PG_LITE_DATA_DIR = "./.pglite-test-data";
process.env.APP_MODE = "local";
process.env.PROVIDER_MODE = "demo";
