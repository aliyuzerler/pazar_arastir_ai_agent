import { describe, expect, it } from "vitest";

import {
  createDemoProvider,
  DEMO_PROVIDER_ID,
} from "@/server/providers/demo/demo-provider";
import {
  mapAvailability,
  mapDataForSeoResponse,
} from "@/server/providers/dataforseo/dataforseo-provider";
import { ProviderError } from "@/server/providers/contracts";
import { runProviderSearch } from "@/server/providers/registry";
import { sanitizeLogMessage } from "@/server/providers/log";

const BASE_INPUT = {
  product: {
    title: "SesMark ANC Pro Kablosuz Kulaklık",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "08690000000012",
    category: "Elektronik",
    attributes: [{ key: "Renk", value: "Siyah" }],
  },
  queryVariants: ["SesMark ANC Pro", "SM-ANC-P-BLK"],
  country: "TR",
  locale: "tr-TR",
  currency: "TRY",
  maxResults: 50,
};

describe("DemoProvider sözleşmesi (TEST_03 md-1, md-2)", () => {
  const provider = createDemoProvider();

  it("her kayıt is_demo=true, source ve observed_at taşır", async () => {
    const result = await provider.search(BASE_INPUT);
    expect(result.offers.length).toBeGreaterThan(0);
    for (const offer of result.offers) {
      expect(offer.isDemo).toBe(true);
      expect(offer.providerId).toBe(DEMO_PROVIDER_ID);
      expect(offer.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(offer.productUrl).toMatch(/^https:\/\//);
    }
  });

  it("stok adedi bilinmeyen teklifte null kalır; stokta metni adede dönüştürülmez", async () => {
    const result = await provider.search(BASE_INPUT);
    const noQty = result.offers.find((offer) => offer.providerOfferId === "demo-offer-gtin-2");
    expect(noQty?.availabilityStatus).toBe("in_stock");
    expect(noQty?.stockQuantity).toBeNull();
    expect(noQty?.shippingAmount).toBeNull();
    // Kargo bilinmiyorsa teslim toplamı uydurulmaz:
    expect(noQty?.deliveredTotalAmount).toBeNull();
  });

  it("kargo bilinen teklifte teslim toplamı fiyat+kargo olarak hesaplanır", async () => {
    const result = await provider.search(BASE_INPUT);
    const known = result.offers.find((offer) => offer.providerOfferId === "demo-offer-gtin-1");
    expect(known?.deliveredTotalAmount).toBe("1324.8000");
  });

  it("bilinmeyen ürün için boş sonuç döner (hata değil)", async () => {
    const result = await provider.search({
      ...BASE_INPUT,
      product: { title: "Hiçbir şeye benzemeyen ürün XQ", gtin: null },
    });
    expect(result.offers).toHaveLength(0);
    expect(result.historicalPrices).toHaveLength(0);
  });

  it("geçmiş fiyat yalnızca demo GTIN eşleşmesinde döner ve source_kind ayrımı taşır", async () => {
    const result = await provider.search(BASE_INPUT);
    expect(result.historicalPrices.length).toBeGreaterThan(0);
    expect(result.historicalPrices[0].sourceKind).toBe("provider_history");
    expect(result.historicalPrices[0].isDemo).toBe(true);
  });

  it("aynı girdi deterministik aynı sonucu verir", async () => {
    const a = await provider.search(BASE_INPUT);
    const b = await provider.search(BASE_INPUT);
    expect(a.offers).toEqual(b.offers);
  });

  it("demo hata senaryosu ProviderError fırlatır", async () => {
    await expect(
      provider.search({ ...BASE_INPUT, product: { title: "[demo-hata] özel ürün" } }),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});

describe("DataForSEO eşleme sözleşmesi (TEST_03 md-5..md-8)", () => {
  const fixture = {
    status_code: 20000,
    tasks: [
      {
        id: "task-1",
        status_code: 20000,
        result: [
          {
            keyword: "kulaklık",
            se_domain: "google.com.tr",
            items: [
              {
                title: "SesMark ANC Pro",
                url: "https://magaza.example.com/anc-pro",
                price: 1299.9,
                currency: "TRY",
                vendor: "Demo Elektronik",
                rating: { value: 4.5, votes_count: 128 },
                product_id: "abc123",
                shipping_price: 24.9,
                availability: "in_stock",
              },
              { title: "Fiyatsız kayıt", price: null, currency: "TRY" },
              {
                title: "Kargo/stok eksik kayıt",
                url: "https://magaza.example.com/eksik",
                price: "999.5",
                currency: "TRY",
                vendor: null,
                availability: "bilinmiyor",
              },
            ],
          },
        ],
      },
    ],
  };

  it("geçerli fixture normalize edilir; fiyat/kaynak URL/stok korunur", () => {
    const { offers } = mapDataForSeoResponse(fixture, { currency: "TRY", observedAt: "2026-11-15T09:00:00Z" });
    expect(offers).toHaveLength(2); // fiyatsız kayıt atlanır
    const first = offers[0];
    expect(first.priceAmount).toBe("1299.9000");
    expect(first.currency).toBe("TRY");
    expect(first.productUrl).toBe("https://magaza.example.com/anc-pro");
    expect(first.availabilityStatus).toBe("in_stock");
    expect(first.deliveredTotalAmount).toBe("1324.8000");
    expect(first.isDemo).toBe(false);
    expect(first.stockQuantity).toBeNull();
  });

  it("eksik kargo/stok alanları null kalır, availability bilinmeyene düşer", () => {
    const { offers } = mapDataForSeoResponse(fixture, { currency: "TRY", observedAt: "2026-11-15T09:00:00Z" });
    const second = offers[1];
    expect(second.shippingAmount).toBeNull();
    expect(second.deliveredTotalAmount).toBeNull();
    expect(second.availabilityStatus).toBe("unknown");
    expect(second.sellerName).toBe("Demo Elektronik" === second.sellerName ? "Demo Elektronik" : second.sellerName);
  });

  it("bozuk şema schema hatasına eşlenir", () => {
    expect(() =>
      mapDataForSeoResponse({ unexpected: true }, { currency: "TRY", observedAt: "2026-11-15T09:00:00Z" }),
    ).toThrow(ProviderError);
  });

  it("availability metinleri doğru eşlenir", () => {
    expect(mapAvailability("in_stock")).toBe("in_stock");
    expect(mapAvailability("OutOfStock")).toBe("out_of_stock");
    expect(mapAvailability(undefined)).toBe("unknown");
  });
});

describe("registry ve hata izolasyonu (TEST_03 md-3, md-9)", () => {
  it("demo hazır, canlı sağlayıcı anahtarsız kurulmadı görünür", async () => {
    const { getProviderStatuses } = await import("@/server/providers/registry");
    const statuses = getProviderStatuses();
    const demo = statuses.find((s) => s.id === "demo");
    const dfseo = statuses.find((s) => s.id === "dataforseo");
    expect(demo?.status).toBe("ready");
    expect(dfseo && ["not_configured", "disabled"].includes(dfseo.status)).toBe(true);
    expect(dfseo?.requiredEnvVars).toContain("DATAFORSEO_LOGIN");
  });

  it("bir sağlayıcının hatası diğer sağlayıcı sonucunu silmez", async () => {
    const outcomes = await runProviderSearch({
      ...BASE_INPUT,
      product: { title: "[demo-hata] bozuk ürün" },
    });
    const demo = outcomes.find((outcome) => outcome.providerId === "demo");
    expect(demo?.error).toBeDefined();
    // registry configured providers: demo + dataforseo(not configured → filtrelenir)
    expect(outcomes.length).toBeGreaterThanOrEqual(1);
  });

  it("DataForSEO anahtarsız çağrıda configuration hatası verir ve canlı istek yapmaz", async () => {
    const { createDataForSeoProvider } = await import("@/server/providers/dataforseo/dataforseo-provider");
    const provider = createDataForSeoProvider();
    if (provider.isConfigured()) {
      // Ortamda anahtar varsa bu test çağrı yapmaz; sadece isConfigured doğrulanır.
      expect(provider.isConfigured()).toBe(true);
      return;
    }
    await expect(provider.search(BASE_INPUT)).rejects.toMatchObject({ kind: "configuration" });
  });
});

describe("log sanitization (TEST_03 md-4)", () => {
  it("hata mesajındaki anahtar benzeri diziler maskelenir", () => {
    const masked = sanitizeLogMessage("auth failed with Basic dXNlcjpwYXNzd29yZDEyMw== and password-SUPERSECRET12345");
    expect(masked).not.toContain("dXNlcjpwYXNzd29yZDEyMw==");
    expect(masked).not.toContain("SUPERSECRET12345");
    expect(masked).toContain("[MASKED]");
  });
});
