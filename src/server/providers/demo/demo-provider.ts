/**
 * DemoProvider — gerçek API çağrısı yapmaz; deterministik fixture seti döndürür.
 * Senaryolar: exact GTIN, MPN+brand likely exact, yanlış varyant, muadil,
 * stok bilinmiyor, stok adedi, kargo bilinmiyor, stok yok, boş arama, hata.
 * Tüm kayıtlar is_demo=true, source ve observed_at taşır (TEST_03 md-2).
 */
import type {
  NormalizedOffer,
  ProductResearchProvider,
  ProviderCapabilities,
  ProviderSearchInput,
  ProviderSearchResult,
  ProviderPricePoint,
} from "../contracts";
import { ProviderError } from "../contracts";

const OBSERVED_AT = "2026-11-15T09:00:00.000Z";
const OLD_OBSERVED_AT = "2026-11-01T09:00:00.000Z";

export const DEMO_PROVIDER_ID = "demo";

export const DEMO_CAPABILITIES: ProviderCapabilities = {
  keywordSearch: true,
  gtinSearch: true,
  mpnSearch: true,
  productDetails: false,
  stockStatus: true,
  stockQuantity: true,
  shippingPrice: true,
  historicalPrices: true,
  sellerOffers: true,
  marketplaces: ["demo-marketplace"],
  countries: ["TR"],
};

interface DemoFixture {
  providerOfferId: string;
  title: string;
  brand: string | null;
  model: string | null;
  mpn: string | null;
  gtin: string | null;
  sellerName: string;
  priceAmount: string;
  shippingAmount: string | null;
  availabilityStatus: NormalizedOffer["availabilityStatus"];
  stockQuantity: number | null;
  variantAttributes: Record<string, string> | null;
  observedAt?: string;
  rating?: string;
  reviewCount?: number;
}

/** ANC Pro kulaklık senaryosu: exact + likely exact + yanlış varyant + muadil. */
const HEADPHONE_FIXTURES: DemoFixture[] = [
  {
    providerOfferId: "demo-offer-gtin-1",
    title: "SesMark ANC Pro Kablosuz Kulaklık (Siyah)",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "08690000000012",
    sellerName: "Demo Elektronik",
    priceAmount: "1299.90",
    shippingAmount: "24.90",
    availabilityStatus: "in_stock",
    stockQuantity: 42,
    variantAttributes: { Renk: "Siyah" },
    rating: "4.5",
    reviewCount: 128,
  },
  {
    providerOfferId: "demo-offer-gtin-2",
    title: "SesMark ANC Pro Bluetooth Kulaklık Siyah",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "08690000000012",
    sellerName: "Demo Mağaza 2",
    priceAmount: "1325.00",
    shippingAmount: null, // kargo bilinmiyor → delivered total null kalır
    availabilityStatus: "in_stock",
    stockQuantity: null, // in_stock ama adet yok
    variantAttributes: { Renk: "Siyah" },
  },
  {
    providerOfferId: "demo-offer-mpn-1",
    title: "SesMark ANC-P Over-Ear Kulaklık (Beyaz)",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-WHT",
    gtin: null,
    sellerName: "Demo Mağaza 3",
    priceAmount: "1275.00",
    shippingAmount: "19.90",
    availabilityStatus: "limited_stock",
    stockQuantity: 3,
    variantAttributes: { Renk: "Beyaz" }, // yanlış varyant → exact olamaz
  },
  {
    providerOfferId: "demo-offer-sub-1",
    title: "TechSound Hush Over-Ear Kulaklık ANC",
    brand: "TechSound",
    model: "Hush",
    mpn: null,
    gtin: null,
    sellerName: "Demo Mağaza 4",
    priceAmount: "999.00",
    shippingAmount: "0.00",
    availabilityStatus: "in_stock",
    stockQuantity: 17,
    variantAttributes: { Renk: "Siyah" },
  },
  {
    providerOfferId: "demo-offer-out-1",
    title: "SesMark ANC Pro Kulaklık (Kırmızı)",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-RED",
    gtin: "08690000000036",
    sellerName: "Demo Mağaza 5",
    priceAmount: "1350.00",
    shippingAmount: "24.90",
    availabilityStatus: "out_of_stock",
    stockQuantity: 0,
    variantAttributes: { Renk: "Kırmızı" },
  },
  {
    providerOfferId: "demo-offer-pre-1",
    title: "SesMark ANC Pro 2. Nesil (Ön Sipariş)",
    brand: "SesMark",
    model: "ANC-P2",
    mpn: "SM-ANC-P2",
    gtin: "08690000000029",
    sellerName: "Demo Elektronik",
    priceAmount: "1599.00",
    shippingAmount: "24.90",
    availabilityStatus: "preorder",
    stockQuantity: null,
    variantAttributes: null,
    observedAt: OLD_OBSERVED_AT, // bayat veri senaryosu
  },
];

const THERMOSTAT_FIXTURES: DemoFixture[] = [
  {
    providerOfferId: "demo-offer-thermo-1",
    title: "EvMark X1 Akıllı Termostat",
    brand: "EvMark",
    model: "X1",
    mpn: "EM-X1",
    gtin: null,
    sellerName: "Demo Yapı Market",
    priceAmount: "1899.00",
    shippingAmount: "49.90",
    availabilityStatus: "in_stock",
    stockQuantity: 8,
    variantAttributes: null,
  },
  {
    providerOfferId: "demo-offer-thermo-2",
    title: "WarmTouch WT500 Programlanabilir Termostat",
    brand: "WarmTouch",
    model: "WT500",
    mpn: null,
    gtin: null,
    sellerName: "Demo Mağaza 2",
    priceAmount: "1449.00",
    shippingAmount: null,
    availabilityStatus: "unknown", // stok durumu bilinmiyor
    stockQuantity: null,
    variantAttributes: null,
  },
];

const PROJECTOR_FIXTURES: DemoFixture[] = [
  {
    providerOfferId: "demo-offer-proj-1",
    title: "GörüMark MiniBeam-200 Portatif Projektör",
    brand: "GörüMark",
    model: "MiniBeam-200",
    mpn: "GM-MB200",
    gtin: "08690000000052",
    sellerName: "Demo Elektronik",
    priceAmount: "2749.00",
    shippingAmount: "59.90",
    availabilityStatus: "in_stock",
    stockQuantity: 5,
    variantAttributes: null,
  },
];

/** Geçmiş fiyat noktaları (yalnızca demo GTIN eşleşmesinde). */
const HEADPHONE_HISTORY: ProviderPricePoint[] = [
  { providerId: DEMO_PROVIDER_ID, priceAmount: "1399.00", currency: "TRY", observedAt: OLD_OBSERVED_AT, sourceKind: "provider_history", isDemo: true },
  { providerId: DEMO_PROVIDER_ID, priceAmount: "1349.00", currency: "TRY", observedAt: "2026-11-08T09:00:00.000Z", sourceKind: "provider_history", isDemo: true },
  { providerId: DEMO_PROVIDER_ID, priceAmount: "1299.90", currency: "TRY", observedAt: OBSERVED_AT, sourceKind: "provider_history", isDemo: true },
];

function toNormalizedOffer(fixture: DemoFixture, currency: string): NormalizedOffer {
  const observedAt = fixture.observedAt ?? OBSERVED_AT;
  return {
    providerId: DEMO_PROVIDER_ID,
    providerOfferId: fixture.providerOfferId,
    title: fixture.title,
    brand: fixture.brand,
    model: fixture.model,
    mpn: fixture.mpn,
    gtin: fixture.gtin,
    sellerName: fixture.sellerName,
    marketplace: "demo-marketplace",
    productUrl: `https://demo.example.com/urun/${fixture.providerOfferId}`,
    imageUrl: null,
    priceAmount: fixture.priceAmount,
    currency,
    shippingAmount: fixture.shippingAmount,
    deliveredTotalAmount:
      fixture.shippingAmount === null ? null : (Number(fixture.priceAmount) + Number(fixture.shippingAmount)).toFixed(4),
    availabilityStatus: fixture.availabilityStatus,
    stockQuantity: fixture.stockQuantity,
    rating: fixture.rating ?? null,
    reviewCount: fixture.reviewCount ?? null,
    condition: null,
    variantAttributes: fixture.variantAttributes,
    observedAt,
    isDemo: true,
    rawReference: { fixture: "demo", providerOfferId: fixture.providerOfferId },
  };
}

function selectFixtures(input: ProviderSearchInput): DemoFixture[] {
  const haystack = [
    input.product.title,
    input.product.brand,
    input.product.model,
    input.product.mpn,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Test senaryosu: özel işaretli başlık sağlayıcı hatasını tetikler.
  if (haystack.includes("[demo-hata]")) {
    throw new ProviderError("unknown", DEMO_PROVIDER_ID, "Demo sağlayıcı hatası senaryosu tetiklendi.");
  }

  if (haystack.includes("kulaklık") || haystack.includes("anc")) {
    return HEADPHONE_FIXTURES;
  }
  if (haystack.includes("termostat")) {
    return THERMOSTAT_FIXTURES;
  }
  if (haystack.includes("projeksiyon") || haystack.includes("minibeam")) {
    return PROJECTOR_FIXTURES;
  }
  return []; // boş arama senaryosu
}

export function createDemoProvider(): ProductResearchProvider {
  return {
    id: DEMO_PROVIDER_ID,
    displayName: "DemoProvider",
    isDemo: true,
    capabilities: DEMO_CAPABILITIES,
    isConfigured: () => true,
    async search(input: ProviderSearchInput): Promise<ProviderSearchResult> {
      // Deterministik: girdiye göre sabit fixture seçimi; tarih sabit.
      const fixtures = selectFixtures(input);
      const offers = fixtures.map((fixture) => toNormalizedOffer(fixture, input.currency));
      const historical = offers.some((offer) => offer.gtin === "08690000000012")
        ? HEADPHONE_HISTORY
        : [];
      return { providerId: DEMO_PROVIDER_ID, offers, historicalPrices: historical };
    },
  };
}
