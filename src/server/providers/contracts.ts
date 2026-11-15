/**
 * Provider sözleşmeleri ve normalize edilmiş domain tipleri
 * (docs/02 §4, docs/04, provider-integration skill).
 *
 * Kritik kurallar:
 * - null "bilgi yok" anlamına gelir; 0/false gibi uydurma değer yazılmaz.
 * - Her teklif source, observed_at, URL, currency ve is_demo taşır.
 * - Provider hataları kaynak bazında izole edilir.
 */
import { z } from "zod";

export type AvailabilityStatus = "in_stock" | "limited_stock" | "out_of_stock" | "preorder" | "unknown";

export const providerCapabilitiesSchema = z.object({
  keywordSearch: z.boolean(),
  gtinSearch: z.boolean(),
  mpnSearch: z.boolean(),
  productDetails: z.boolean(),
  stockStatus: z.boolean(),
  stockQuantity: z.boolean(),
  shippingPrice: z.boolean(),
  historicalPrices: z.boolean(),
  sellerOffers: z.boolean(),
  marketplaces: z.array(z.string()),
  countries: z.array(z.string()),
});

export type ProviderCapabilities = z.infer<typeof providerCapabilitiesSchema>;

export interface ProviderProductContext {
  title: string;
  brand?: string | null;
  model?: string | null;
  mpn?: string | null;
  gtin?: string | null; // normalize edilmiş değer
  category?: string | null;
  attributes?: { key: string; value: string }[];
}

export interface ProviderSearchInput {
  product: ProviderProductContext;
  /** Sırayla denenecek sorgu varyantları (başlık, marka+model, MPN, GTIN). */
  queryVariants: string[];
  country: string;
  locale: string;
  currency: string;
  maxResults: number;
}

export const providerOfferSchema = z.object({
  providerId: z.string(),
  providerOfferId: z.string(),
  title: z.string(),
  brand: z.string().nullish(),
  model: z.string().nullish(),
  mpn: z.string().nullish(),
  gtin: z.string().nullish(),
  sellerName: z.string(),
  marketplace: z.string().nullish(),
  productUrl: z.string().url(),
  imageUrl: z.string().url().nullish(),
  priceAmount: z.string(), // onluk metin (Decimal ile hesaplanır)
  currency: z.string().length(3),
  shippingAmount: z.string().nullable(),
  deliveredTotalAmount: z.string().nullable(),
  availabilityStatus: z.enum([
    "in_stock",
    "limited_stock",
    "out_of_stock",
    "preorder",
    "unknown",
  ]),
  stockQuantity: z.number().int().nullable(),
  rating: z.string().nullable(),
  reviewCount: z.number().int().nullable(),
  condition: z.string().nullish(),
  variantAttributes: z.record(z.string()).nullable(),
  observedAt: z.string(), // ISO-8601 UTC
  isDemo: z.boolean(),
  rawReference: z.record(z.unknown()).nullish(),
});

export type NormalizedOffer = z.infer<typeof providerOfferSchema>;

export interface ProviderPricePoint {
  providerId: string;
  priceAmount: string;
  currency: string;
  observedAt: string;
  sourceKind: "provider_history";
  isDemo: boolean;
}

export type ProviderFailureKind =
  | "rate_limited"
  | "authentication"
  | "configuration"
  | "timeout"
  | "network"
  | "schema"
  | "unknown";

export interface ProviderSearchResult {
  providerId: string;
  offers: NormalizedOffer[];
  historicalPrices: ProviderPricePoint[];
  /** Provider kendi içinde kısmi sonuç döndüyse açıklama. */
  warning?: string;
}

export interface ProductResearchProvider {
  id: string;
  displayName: string;
  isDemo: boolean;
  capabilities: ProviderCapabilities;
  isConfigured(): boolean;
  search(input: ProviderSearchInput): Promise<ProviderSearchResult>;
}

export type ProviderStatusKind =
  | "not_configured"
  | "ready"
  | "running"
  | "rate_limited"
  | "temporary_error"
  | "authentication_error"
  | "disabled";

export interface ProviderStatus {
  id: string;
  displayName: string;
  status: ProviderStatusKind;
  isDemo: boolean;
  /** Anahtar döndürülmez; yalnızca hangi env değişkenlerinin beklendiği. */
  requiredEnvVars: string[];
  capabilities: ProviderCapabilities;
}

/** Provider hataları: kind bazlı sınıflandırma, secret içermeyen mesaj. */
export class ProviderError extends Error {
  readonly kind: ProviderFailureKind;
  readonly providerId: string;
  readonly retryable: boolean;

  constructor(kind: ProviderFailureKind, providerId: string, message: string) {
    super(message);
    this.name = "ProviderError";
    this.kind = kind;
    this.providerId = providerId;
    this.retryable = kind === "rate_limited" || kind === "network" || kind === "timeout";
  }
}

/** HTTP durum kodunu provider hatasına eşler (TEST_03 md-8). */
export function mapHttpErrorToProviderError(
  providerId: string,
  httpStatus: number,
  bodySnippet?: string,
): ProviderError {
  if (httpStatus === 429) {
    return new ProviderError("rate_limited", providerId, "Sağlayıcı hız limiti uyguladı (429).");
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return new ProviderError("authentication", providerId, "Kimlik doğrulama başarısız (401/403).");
  }
  if (httpStatus >= 500) {
    return new ProviderError("network", providerId, `Sağlayıcı sunucu hatası (${httpStatus}).`);
  }
  const snippet = bodySnippet ? `: ${bodySnippet.slice(0, 120)}` : "";
  return new ProviderError("unknown", providerId, `Beklenmeyen sağlayıcı yanıtı (${httpStatus})${snippet}`);
}
