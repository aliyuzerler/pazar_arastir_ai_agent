import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} from "@/server/domain/password";
import {
  createSessionToken,
  verifySessionToken,
} from "@/server/domain/session";

describe("parola politikası (TEST_10)", () => {
  it("geçerli parola kabul edilir", () => {
    expect(() => validatePasswordPolicy("Gizli12345")).not.toThrow();
  });

  it("kısa parola reddedilir", () => {
    expect(() => validatePasswordPolicy("Gizli123")).toThrowError(/10 karakter/);
  });

  it("büyük harfsiz parola reddedilir", () => {
    expect(() => validatePasswordPolicy("gizli12345")).toThrowError(/büyük harf/);
  });

  it("rakamsız parola reddedilir", () => {
    expect(() => validatePasswordPolicy("Gizliparola")).toThrowError(/rakam/);
  });

  it("hash doğrulama çalışır ve yanlış parolayı reddeder", () => {
    const hash = hashPassword("Gizli12345");
    expect(hash).not.toContain("Gizli");
    expect(verifyPassword("Gizli12345", hash)).toBe(true);
    expect(verifyPassword("Gizli12346", hash)).toBe(false);
  });
});

describe("oturum tokenı (TEST_10)", () => {
  it("imzalı token doğrulanır ve talepler döner", async () => {
    const token = await createSessionToken({
      sub: "u-1",
      email: "a@b.com",
      role: "user",
      wid: "w-1",
    });
    const claims = await verifySessionToken(token);
    expect(claims?.sub).toBe("u-1");
    expect(claims?.wid).toBe("w-1");
  });

  it("bozuk token null döner", async () => {
    expect(await verifySessionToken("not-a-token")).toBeNull();
  });
});
