import { describe, expect, it } from "vitest";

import { neutralizeCsvCell, mapCsvHeaders, parseCsv } from "@/server/domain/csv";
import { normalizeGtin } from "@/server/domain/gtin";
import { parseDecimalString, productInputSchema } from "@/server/domain/product-validation";

describe("GTIN normalize (TEST_02 md-3)", () => {
  it("ayraçları temizler, 14 haneye tamamlar, orijinali korur", () => {
    const result = normalizeGtin("869-000 000001.2");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("08690000000012");
    expect(result.original).toBe("869-000 000001.2");
  });

  it("GTIN-8, 12 ve 13 biçimlerini doğrular", () => {
    expect(normalizeGtin("73513537")?.valid).toBe(true); // GTIN-8 örneği
    expect(normalizeGtin("036000291452")?.valid).toBe(true); // GTIN-12 (UpC)
    expect(normalizeGtin("8690000000012")?.valid).toBe(true); // GTIN-13
  });

  it("kontrol hanesi hatalıysa reddeder", () => {
    const result = normalizeGtin("8690000000017");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("kontrol hanesi");
  });

  it("harf ve geçersiz uzunluk reddeder", () => {
    expect(normalizeGtin("8690ABC000016").valid).toBe(false);
    expect(normalizeGtin("1234").valid).toBe(false);
  });

  it("boş değer geçersizdir ama hata fırlatmaz", () => {
    expect(normalizeGtin("").valid).toBe(false);
  });
});

describe("onluk metin ayrıştırma", () => {
  it("virgüllü ve noktalı biçimleri kanonikleştirir", () => {
    expect(parseDecimalString("1.299,90")).toBe("1299.90");
    expect(parseDecimalString("850.00")).toBe("850.00");
    expect(parseDecimalString(" 20 ")).toBe("20");
  });

  it("negatif ve bozuk girdileri reddeder", () => {
    expect(parseDecimalString("-5")).toBeNull();
    expect(parseDecimalString("12;3")).toBeNull();
    expect(parseDecimalString("abc")).toBeNull();
  });
});

describe("ürün girdi doğrulama (TEST_02 md-2)", () => {
  const validBase = { title: "Test Ürün", unitCost: "100", currency: "try" };

  it("geçerli girdi kabul edilir ve para birimi büyütülür", () => {
    const result = productInputSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("TRY");
      expect(result.data.unitCost).toBe("100");
    }
  });

  it("boş başlık reddedilir", () => {
    const result = productInputSchema.safeParse({ ...validBase, title: "   " });
    expect(result.success).toBe(false);
  });

  it("negatif maliyet reddedilir", () => {
    const result = productInputSchema.safeParse({ ...validBase, unitCost: "-1" });
    expect(result.success).toBe(false);
  });

  it("hatalı para birimi reddedilir", () => {
    const result = productInputSchema.safeParse({ ...validBase, currency: "TURK" });
    expect(result.success).toBe(false);
  });

  it("geçersiz GTIN reddedilir", () => {
    const result = productInputSchema.safeParse({ ...validBase, gtin: "1234567890123" });
    expect(result.success).toBe(false);
  });

  it("http (https olmayan) URL reddedilir", () => {
    const result = productInputSchema.safeParse({ ...validBase, productUrl: "http://ornek.com" });
    expect(result.success).toBe(false);
  });
});

describe("CSV ayrıştırma ve başlık eşleme (TEST_02 md-6)", () => {
  it("tırnaklı ve virgüllü alanları doğru ayrıştırır", () => {
    const csv = 'title,unit_cost,currency\n"Kulaklık, ANC",850.00,TRY\nTermostat,1240,TRY';
    const parsed = parseCsv(csv);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0][0]).toBe("Kulaklık, ANC");
  });

  it("Türkçe başlık takma adlarını eşler", () => {
    const { mapping, missing } = mapCsvHeaders(["ürün adı", "maliyet", "para birimi", "marka"]);
    expect(missing).toEqual([]);
    expect([...mapping.values()]).toContain("title");
    expect([...mapping.values()]).toContain("unitCost");
    expect([...mapping.values()]).toContain("currency");
  });

  it("zorunlu başlık eksikse raporlar", () => {
    const { missing } = mapCsvHeaders(["marka", "model"]);
    expect(missing.join(" ")).toContain("title");
  });
});

describe("CSV formül nötralizasyonu (TEST_02 md-8)", () => {
  it("=,+,-,@ ile başlayan hücreleri nötralize eder", () => {
    expect(neutralizeCsvCell("=HYPERLINK(\"http://kotu\")")).toBe("'=HYPERLINK(\"http://kotu\")");
    expect(neutralizeCsvCell("+123")).toBe("'+123");
    expect(neutralizeCsvCell("-5")).toBe("'-5");
    expect(neutralizeCsvCell("@cmd")).toBe("'@cmd");
    expect(neutralizeCsvCell("temiz metin")).toBe("temiz metin");
  });
});
