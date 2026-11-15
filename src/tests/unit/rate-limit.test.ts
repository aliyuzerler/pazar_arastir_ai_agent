import { describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimits } from "@/server/security/rate-limit";

describe("hız sınırı (TEST_11)", () => {
  it("limit dolunca istekler reddedilir", () => {
    resetRateLimits();
    const key = "login:1.2.3.4";
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit(key, 5).allowed).toBe(true);
    }
    expect(checkRateLimit(key, 5).allowed).toBe(false);
  });

  it("pencere sıfırlanınca izin yeniden açılır", () => {
    resetRateLimits();
    const key = "register:5.6.7.8";
    for (let i = 0; i < 3; i += 1) checkRateLimit(key, 3, 1);
    expect(checkRateLimit(key, 3, 1).allowed).toBe(false);
    // pencere 1ms — bekle ve tekrar dene
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(key, 3, 1).allowed).toBe(true);
        resolve();
      }, 5);
    });
  });

  it("farklı anahtarlar ayrı sayılır", () => {
    resetRateLimits();
    expect(checkRateLimit("a:1", 1).allowed).toBe(true);
    expect(checkRateLimit("a:2", 1).allowed).toBe(true);
    expect(checkRateLimit("a:1", 1).allowed).toBe(false);
  });
});
