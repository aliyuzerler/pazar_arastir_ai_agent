/**
 * Deterministik exact/muadil eşleştirme motoru (docs/05 §2-§5).
 *
 * Karar sırası:
 * 1. GTIN eşleşmesi           → exact (100, gtin)
 * 2. MPN + marka eşleşmesi    → likely_exact (95, mpn_brand)
 * 3. Marka + model eşleşmesi  → kritik varyant uyumluysa likely_exact (85,
 *    brand_model); kritik varyant ÇELİŞİYORSA substitute (45) + fark listesi
 * 4. Kategori eşleşmesi       → substitute (50, category_match)
 * 5. Yalnız başlık benzerliği → unreviewed (10) — tek başına exact kanıtı değildir
 */
import type { NormalizedOffer, ProviderProductContext } from "@/server/providers/contracts";

export type MatchType = "exact" | "likely_exact" | "substitute" | "unreviewed";
export type MatchMethod =
  | "gtin"
  | "mpn_brand"
  | "brand_model"
  | "attribute_similarity"
  | "title_similarity";

export interface MatchDecision {
  matchType: MatchType;
  matchScore: number;
  matchMethod: MatchMethod;
  matchReasons: string[];
  differences: string[];
}

/** Kritik varyant alanları: çelişki exact sınıfını düşürür (docs/05 §2). */
const CRITICAL_ATTRIBUTE_KEYS = ["renk", "kapasite", "beden", "paket", "ölçü", "voltaj"];

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function variantConflicts(
  product: ProviderProductContext,
  offer: NormalizedOffer,
): { conflicts: string[]; matches: string[] } {
  const productAttributes = new Map(
    (product.attributes ?? []).map((attribute) => [normalizeText(attribute.key), attribute.value]),
  );
  const offerVariants = offer.variantAttributes ?? {};
  const conflicts: string[] = [];
  const matches: string[] = [];

  for (const [variantKey, variantValue] of Object.entries(offerVariants)) {
    const key = normalizeText(variantKey);
    if (!CRITICAL_ATTRIBUTE_KEYS.some((critical) => key.includes(critical))) continue;
    const expected = productAttributes.get(key);
    if (expected === undefined) continue; // bilinmiyor → çelişki sayma
    if (normalizeText(expected) !== normalizeText(variantValue)) {
      conflicts.push(`${variantKey}: beklenen ${expected}, teklifte ${variantValue}`);
    } else {
      matches.push(`${variantKey}: ${variantValue}`);
    }
  }
  return { conflicts, matches };
}

export function classifyOffer(product: ProviderProductContext, offer: NormalizedOffer): MatchDecision {
  const reasons: string[] = [];
  const differences: string[] = [];

  // 1. GTIN (normalize edilmiş değerlerle karşılaştır)
  if (product.gtin && offer.gtin) {
    const productGtin = product.gtin.replace(/^0+(?=\d{8})/, "").padStart(14, "0");
    const offerGtin = offer.gtin.replace(/^0+(?=\d{8})/, "").padStart(14, "0");
    if (productGtin === offerGtin) {
      return {
        matchType: "exact",
        matchScore: 100,
        matchMethod: "gtin",
        matchReasons: [`GTIN eşleşmesi (${offerGtin})`],
        differences,
      };
    }
    differences.push("GTIN farklı");
  }

  // 2. MPN + marka
  if (
    product.mpn &&
    offer.mpn &&
    normalizeText(product.mpn) === normalizeText(offer.mpn) &&
    normalizeText(product.brand) === normalizeText(offer.brand) &&
    product.brand
  ) {
    // MPN+brand güçlü kanıt; ancak kullanıcı doğrulaması önerilir.
    return {
      matchType: "likely_exact",
      matchScore: 95,
      matchMethod: "mpn_brand",
      matchReasons: [`MPN eşleşmesi (${offer.mpn})`, `Marka eşleşmesi (${offer.brand})`],
      differences,
    };
  }

  // 3. Marka + model (+ kritik varyant kontrolü)
  if (
    product.brand &&
    offer.brand &&
    normalizeText(product.brand) === normalizeText(offer.brand) &&
    product.model &&
    offer.model &&
    normalizeText(product.model) === normalizeText(offer.model)
  ) {
    const { conflicts, matches } = variantConflicts(product, offer);
    reasons.push(`Marka eşleşmesi (${offer.brand})`, `Model eşleşmesi (${offer.model})`);
    if (matches.length > 0) reasons.push(...matches.map((m) => `Varyant uyumlu — ${m}`));
    if (conflicts.length > 0) {
      differences.push(...conflicts);
      return {
        matchType: "substitute",
        matchScore: 45,
        matchMethod: "brand_model",
        matchReasons: reasons,
        differences,
      };
    }
    return {
      matchType: "likely_exact",
      matchScore: 85,
      matchMethod: "brand_model",
      matchReasons: reasons,
      differences,
    };
  }

  // 4. Aynı kullanım alanı → muadil (başlık token kesişimi; marka/model farklı)
  const brand = normalizeText(product.brand);
  const model = normalizeText(product.model);
  const productTokens = normalizeText(product.title)
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 3 &&
        token !== brand &&
        token !== model &&
        !normalizeText(product.mpn).includes(token),
    );
  const offerTitle = normalizeText(offer.title);
  const sharedTokens = productTokens.filter((token) => offerTitle.includes(token));
  if (sharedTokens.length > 0) {
    differences.push(`Marka farklı (${offer.brand ?? "bilinmiyor"})`);
    if (product.model && offer.model && normalizeText(product.model) !== normalizeText(offer.model)) {
      differences.push(`Model farklı (${offer.model})`);
    }
    return {
      matchType: "substitute",
      matchScore: 50,
      matchMethod: "attribute_similarity",
      matchReasons: [`Ortak kullanım terimi: ${sharedTokens.join(", ")}`],
      differences,
    };
  }

  // 5. Yalnız başlık benzerliği → sınıflandırma güveni yetersiz
  return {
    matchType: "unreviewed",
    matchScore: 10,
    matchMethod: "title_similarity",
    matchReasons: ["Yalnızca başlık benzerliği; exact kanıt yok"],
    differences,
  };
}
