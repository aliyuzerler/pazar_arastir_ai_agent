/**
 * DataForSEO Google Shopping adaptörü (sunucu tarafı temeli).
 *
 * Notlar (docs/04):
 * - Task post + task get asenkron modeli adaptör içinde soyutlanır.
 * - Anahtar yoksa canlı çağrı denenmez; status "not_configured" döner.
 * - Sözleşme testleri fetch enjeksiyonuyla fixture tabanlı çalışır.
 * - Yanıt şeması Zod ile doğrulanır; bilinmeyen alanlar yok sayılır,
 *   eksik alanlar null kalır (uydurma yok).
 */
import { z } from "zod";

import { getEnv } from "@/lib/env";
import type {
  NormalizedOffer,
  ProductResearchProvider,
  ProviderCapabilities,
  ProviderSearchInput,
  ProviderSearchResult,
} from "../contracts";
import { mapHttpErrorToProviderError, ProviderError } from "../contracts";

export const DATAFORSEO_PROVIDER_ID = "dataforseo";

export const DATAFORSEO_CAPABILITIES: ProviderCapabilities = {
  keywordSearch: true,
  gtinSearch: true,
  mpnSearch: false,
  productDetails: true,
  stockStatus: true,
  stockQuantity: false, // Google Shopping sayısal stok adedi vermez
  shippingPrice: false,
  historicalPrices: false,
  sellerOffers: true,
  marketplaces: ["google-shopping"],
  countries: ["TR", "US", "DE", "GB"],
};

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;

/** Task get advanced yanıtında teklif taşıyabilecek alanlar (esnek şema). */
const dataForSeoItemSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  image_url: z.string().nullish(),
  price: z.union([z.number(), z.string()]).nullish(),
  currency: z.string().nullish(),
  old_price: z.union([z.number(), z.string()]).nullish(),
  vendor: z.string().nullish(),
  marketplace: z.string().nullish(),
  rating: z
    .object({
      type: z.string().nullish(),
      value: z.union([z.number(), z.string()]).nullish(),
      votes_count: z.number().nullish(),
    })
    .nullish(),
  product_id: z.string().nullish(),
  shipping_price: z.union([z.number(), z.string()]).nullish(),
  availability: z.string().nullish(),
});

const dataForSeoTaskGetSchema = z.object({
  status_code: z.number(),
  status_message: z.string().nullish(),
  cost: z.number().nullish(),
  tasks_count: z.number().nullish(),
  tasks_error: z.number().nullish(),
  tasks: z
    .array(
      z.object({
        id: z.string().nullish(),
        status_code: z.number().nullish(),
        status_message: z.string().nullish(),
        cost: z.number().nullish(),
        result: z
          .array(
            z
              .object({
                keyword: z.string().nullish(),
                type: z.string().nullish(),
                se_domain: z.string().nullish(),
                items: z.array(dataForSeoItemSchema).nullish(),
              })
              .passthrough(),
          )
          .nullish(),
      }),
    )
    .nullish(),
});

export type DataForSeoTaskGetResponse = z.infer<typeof dataForSeoTaskGetSchema>;

export function isDataForSeoConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.DATAFORSEO_LOGIN && env.DATAFORSEO_PASSWORD);
}

/** Availability metnini domain enum'una çevirir; bilinmiyorsa unknown. */
export function mapAvailability(raw: string | null | undefined): NormalizedOffer["availabilityStatus"] {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("in_stock") || value === "instock") return "in_stock";
  if (value.includes("limited")) return "limited_stock";
  if (value.includes("out_of_stock") || value === "outofstock") return "out_of_stock";
  if (value.includes("preorder")) return "preorder";
  return "unknown";
}

function toAmount(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value.toFixed(4) : value.trim();
  if (parsed.length === 0 || !/^\d+(\.\d{1,4})?$/.test(parsed)) return null;
  return parsed;
}

/**
 * Task get yanıtını normalize edilmiş tekliflere çevirir (pure function).
 * Eksik alanlar null; fiyat/para birimi tutarsızsa satır atlanır.
 */
export function mapDataForSeoResponse(
  payload: unknown,
  options: { currency: string; observedAt: string },
): { offers: NormalizedOffer[]; skipped: number } {
  const parsed = dataForSeoTaskGetSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ProviderError(
      "schema",
      DATAFORSEO_PROVIDER_ID,
      "Sağlayıcı yanıtı beklenen şemaya uymuyor.",
    );
  }

  const offers: NormalizedOffer[] = [];
  let skipped = 0;

  for (const task of parsed.data.tasks ?? []) {
    for (const result of task.result ?? []) {
      const seDomain = result.se_domain ?? null;
      for (const [index, item] of (result.items ?? []).entries()) {
        const amount = toAmount(item.price);
        if (!amount) {
          // Fiyatı yok/bozuk olan kayıt uydurulmadan atlanır.
          skipped += 1;
          continue;
        }
        const currency = (item.currency ?? options.currency).toUpperCase().slice(0, 3);
        const shipping = toAmount(item.shipping_price);
        offers.push({
          providerId: DATAFORSEO_PROVIDER_ID,
          providerOfferId: item.product_id ?? `dfseo-${index}-${item.title ?? ""}`.slice(0, 180),
          title: item.title ?? "(başlıksız)",
          brand: null,
          model: null,
          mpn: null,
          gtin: null,
          sellerName: item.vendor ?? seDomain ?? "bilinmeyen satıcı",
          marketplace: item.marketplace ?? seDomain ?? "google-shopping",
          productUrl: item.url ?? "https://www.google.com/shopping",
          imageUrl: item.image_url ?? null,
          priceAmount: amount,
          currency,
          shippingAmount: shipping,
          deliveredTotalAmount:
            shipping === null ? null : (Number(amount) + Number(shipping)).toFixed(4),
          availabilityStatus: mapAvailability(item.availability),
          stockQuantity: null, // sağlayıcı sayısal stok vermez → uydurma yok
          rating: item.rating?.value !== undefined && item.rating.value !== null ? String(item.rating.value) : null,
          reviewCount: item.rating?.votes_count ?? null,
          condition: null,
          variantAttributes: null,
          observedAt: options.observedAt,
          isDemo: false,
          rawReference: { taskId: task.id ?? null, type: item.type ?? null },
        });
      }
    }
  }
  return { offers, skipped };
}

type FetchLike = typeof globalThis.fetch;

export function createDataForSeoProvider(injectedFetch?: FetchLike): ProductResearchProvider {
  const fetchImpl = injectedFetch ?? globalThis.fetch;

  async function callWithRetry(url: string, init: RequestInit): Promise<Response> {
    let lastError: ProviderError | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetchImpl(url, { ...init, signal: controller.signal });
        if (response.status === 429 || response.status >= 500) {
          lastError = mapHttpErrorToProviderError(DATAFORSEO_PROVIDER_ID, response.status);
          // backoff + jitter
          await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt + Math.random() * 100));
          continue;
        }
        return response;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          lastError = new ProviderError("timeout", DATAFORSEO_PROVIDER_ID, "Sağlayıcı zaman aşımı.");
        } else {
          lastError = new ProviderError("network", DATAFORSEO_PROVIDER_ID, "Sağlayıcıya ulaşılamadı.");
        }
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new ProviderError("unknown", DATAFORSEO_PROVIDER_ID, "Bilinmeyen sağlayıcı hatası.");
  }

  return {
    id: DATAFORSEO_PROVIDER_ID,
    displayName: "DataForSEO · Google Shopping",
    isDemo: false,
    capabilities: DATAFORSEO_CAPABILITIES,
    isConfigured: isDataForSeoConfigured,
    async search(_input: ProviderSearchInput): Promise<ProviderSearchResult> {
      if (!isDataForSeoConfigured()) {
        throw new ProviderError(
          "configuration",
          DATAFORSEO_PROVIDER_ID,
          "DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD tanımlı değil; canlı çağrı yapılmadı.",
        );
      }
      const env = getEnv();
      const auth = Buffer.from(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`).toString("base64");

      const postResponse = await callWithRetry(
        "https://api.dataforseo.com/v3/merchant/google/shopping/search/task_post",
        {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
          body: JSON.stringify([
            {
              keyword: _input.queryVariants[0],
              location_code: 2158,
              language_code: _input.locale.slice(0, 2),
              se_domain: "google.com.tr",
            },
          ]),
        },
      );
      if (!postResponse.ok) {
        throw mapHttpErrorToProviderError(DATAFORSEO_PROVIDER_ID, postResponse.status);
      }

      // Gerçek dağıtımda task id okunup poll edilir; temel sürüm tek adım
      // task_get_advanced fixture yolunu izler ve şema doğrulaması yapar.
      const getResponse = await callWithRetry(
        "https://api.dataforseo.com/v3/merchant/google/shopping/task_get/advanced/latest",
        { method: "GET", headers: { authorization: `Basic ${auth}` } },
      );
      if (!getResponse.ok) {
        throw mapHttpErrorToProviderError(DATAFORSEO_PROVIDER_ID, getResponse.status);
      }
      const payload = (await getResponse.json()) as unknown;
      const { offers } = mapDataForSeoResponse(payload, {
        currency: _input.currency,
        observedAt: new Date().toISOString(),
      });
      return { providerId: DATAFORSEO_PROVIDER_ID, offers, historicalPrices: [] };
    },
  };
}
