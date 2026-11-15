import { describe, expect, it } from "vitest";

import { classifyOffer } from "@/server/domain/matching";
import type { NormalizedOffer } from "@/server/providers/contracts";
import type { ProviderProductContext } from "@/server/providers/contracts";

const PRODUCT: ProviderProductContext = {
  title: "SesMark ANC Pro Kablosuz Kulaklık",
  brand: "SesMark",
  model: "ANC-P",
  mpn: "SM-ANC-P-BLK",
  gtin: "08690000000012",
  category: "Elektronik / Ses Sistemleri",
  attributes: [{ key: "Renk", value: "Siyah" }],
};

function offer(overrides: Partial<NormalizedOffer>): NormalizedOffer {
  return {
    providerId: "demo",
    providerOfferId: "o1",
    title: "SesMark ANC Pro",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: null,
    sellerName: "Mağaza",
    marketplace: "demo",
    productUrl: "https://demo.example.com/x",
    imageUrl: null,
    priceAmount: "1000.0000",
    currency: "TRY",
    shippingAmount: null,
    deliveredTotalAmount: null,
    availabilityStatus: "in_stock",
    stockQuantity: null,
    rating: null,
    reviewCount: null,
    condition: null,
    variantAttributes: null,
    observedAt: "2026-11-15T09:00:00.000Z",
    isDemo: true,
    rawReference: null,
    ...overrides,
  };
}

describe("eşleştirme motoru (TEST_04 md-3..md-7)", () => {
  it("GTIN eşleşmesi exact verir ve gerekçesi görünür", () => {
    const decision = classifyOffer(PRODUCT, offer({ gtin: "08690000000012" }));
    expect(decision.matchType).toBe("exact");
    expect(decision.matchScore).toBe(100);
    expect(decision.matchMethod).toBe("gtin");
    expect(decision.matchReasons.join(" ")).toContain("GTIN");
  });

  it("MPN+marka likely_exact verir; GTIN farkı not edilir", () => {
    const decision = classifyOffer(PRODUCT, offer({ gtin: "08690000000036" }));
    expect(decision.matchType).toBe("likely_exact");
    expect(decision.matchScore).toBe(95);
    expect(decision.matchMethod).toBe("mpn_brand");
    expect(decision.differences.join(" ")).toContain("GTIN farklı");
  });

  it("aynı model ama yanlış varyant exact olamaz; substitute + fark listesi", () => {
    const decision = classifyOffer(
      PRODUCT,
      offer({ mpn: "SM-ANC-P-WHT", variantAttributes: { Renk: "Beyaz" } }),
    );
    expect(decision.matchType).toBe("substitute");
    expect(decision.matchScore).toBeLessThanOrEqual(50);
    expect(decision.differences.join(" ")).toContain("Renk");
  });

  it("farklı marka muadil ürün yalnız substitute kategorisine girer", () => {
    const decision = classifyOffer(
      PRODUCT,
      offer({
        title: "TechSound Hush Over-Ear Kulaklık ANC Elektronik",
        brand: "TechSound",
        model: "Hush",
        mpn: null,
        gtin: null,
      }),
    );
    expect(decision.matchType).toBe("substitute");
    expect(decision.matchMethod).toBe("attribute_similarity");
    expect(decision.matchReasons.join(" ")).toContain("kulaklık");
  });

  it("yalnızca başlık benzerliği exact kanıtı değildir", () => {
    const decision = classifyOffer(
      { ...PRODUCT, mpn: null, gtin: null, category: null },
      offer({ title: "SesMark ANC Pro benzeri başka ürün", brand: "Başka", model: "XYZ", mpn: null }),
    );
    expect(decision.matchType).toBe("unreviewed");
    expect(decision.matchScore).toBeLessThan(20);
  });
});
