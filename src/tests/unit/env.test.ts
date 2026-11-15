import { describe, expect, it } from "vitest";

import { getEnv, resetEnvCache } from "@/lib/env";

/** Testler birbirinden bağımsız çalışsın diye ortamı sıfırlayan yardımcı. */
function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    saved[key] = process.env[key];
    if (vars[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = vars[key];
    }
  }
  resetEnvCache();
  try {
    fn();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
    resetEnvCache();
  }
}

describe("getEnv (ortam doğrulama)", () => {
  it("pglite sürücüsüyle minimum ortam kabul edilir ve varsayılanları uygular", () => {
    withEnv({ DB_DRIVER: "pglite" }, () => {
      const env = getEnv();
      expect(env.DEFAULT_CURRENCY).toBe("TRY");
      expect(env.DEFAULT_LOCALE).toBe("tr-TR");
      expect(env.DEFAULT_COUNTRY).toBe("TR");
      expect(env.APP_MODE).toBe("local");
      expect(env.PROVIDER_MODE).toBe("demo");
    });
  });

  it("DATABASE_URL zorunlu değildir çünkü güvenli yerel varsayılan vardır", () => {
    withEnv({ DB_DRIVER: "postgres" }, () => {
      const env = getEnv();
      expect(env.DATABASE_URL).toContain("postgresql://");
    });
  });

  it("geçersiz değerler alan adlarını raporlar ama secret değeri yazdırmaz", () => {
    withEnv({ DB_DRIVER: "postgres", DEFAULT_COUNTRY: "TUR" }, () => {
      expect(() => getEnv()).toThrowError(/DEFAULT_COUNTRY/);
      expect(() => getEnv()).not.toThrowError(/productintel_local_password/);
    });
  });

  it("geçersiz DB_DRIVER reddedilir", () => {
    withEnv({ DB_DRIVER: "sqlite" }, () => {
      expect(() => getEnv()).toThrowError(/DB_DRIVER/);
    });
  });
});
