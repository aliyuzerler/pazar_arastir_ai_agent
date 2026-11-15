/**
 * Ürün girdi doğrulama şemaları (Zod). Hata mesajları Türkçedir; API ve
 * CSV içe aktarma aynı kuralları paylaşır (docs/01 §2.3).
 */
import { z } from "zod";

import { normalizeGtin } from "./gtin";

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** "1.299,90" / "1299.90" / " 1299 " → kanonik nokta-onluk string. */
export function parseDecimalString(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  let normalized = trimmed.replace(/\s/g, "");
  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }
  if (!/^\d+(\.\d{1,4})?$/.test(normalized)) return null;
  return normalized;
}

const decimalNonNegative = z
  .string()
  .transform((value, ctx) => {
    const parsed = parseDecimalString(value);
    if (parsed === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Geçerli bir sayı girin (örn. 1299.90)." });
      return z.NEVER;
    }
    return parsed;
  })
  .refine((value) => Number(value) >= 0, { message: "Negatif değer girilemez." });

const optionalHttpsUrl = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || /^https:\/\/.+/.test(value), {
    message: "URL https:// ile başlamalıdır.",
  })
  .transform((value) => (value.length === 0 ? null : value))
  .nullish();

export const attributeSchema = z.object({
  key: z.string().trim().min(1, "Özellik adı zorunludur.").max(100),
  value: z.string().trim().min(1, "Özellik değeri zorunludur.").max(500),
});

export const productInputSchema = z.object({
  title: z.string().trim().min(1, "Ürün başlığı zorunludur.").max(300),
  sku: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value.length === 0 ? null : value))
    .nullish(),
  brand: z
    .string()
    .trim()
    .max(150)
    .transform((value) => (value.length === 0 ? null : value))
    .nullish(),
  model: z
    .string()
    .trim()
    .max(150)
    .transform((value) => (value.length === 0 ? null : value))
    .nullish(),
  mpn: z
    .string()
    .trim()
    .max(100)
    .transform((value) => (value.length === 0 ? null : value))
    .nullish(),
  gtin: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value.length === 0) return null;
      const result = normalizeGtin(value);
      if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `GTIN geçersiz (${result.reason ?? "bilinmeyen"}).`,
        });
        return z.NEVER;
      }
      return result.original;
    })
    .nullish(),
  category: z
    .string()
    .trim()
    .max(150)
    .transform((value) => (value.length === 0 ? null : value))
    .nullish(),
  description: z
    .string()
    .trim()
    .max(5000)
    .transform((value) => (value.length === 0 ? null : value))
    .nullish(),
  attributes: z.array(attributeSchema).max(50).nullish(),
  productUrl: optionalHttpsUrl,
  imageUrl: optionalHttpsUrl,
  unitCost: decimalNonNegative,
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CURRENCY_PATTERN, "Para birimi 3 harfli ISO 4217 kodu olmalıdır (örn. TRY)."),
  inboundShippingPerUnit: decimalNonNegative.default("0"),
  packagingCost: decimalNonNegative.default("0"),
  otherFixedCost: decimalNonNegative.default("0"),
  pricingProfileId: z.string().uuid().nullish(),
  trackingEnabled: z.boolean().nullish(),
  trackingIntervalHours: z.number().int().min(1).max(8760).nullish(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const pricingProfileInputSchema = z.object({
  name: z.string().trim().min(1, "Profil adı zorunludur.").max(120),
  marketplaceFeeRate: decimalNonNegative.refine((value) => Number(value) <= 1, {
    message: "Pazaryeri komisyon oranı 0-1 arasında olmalıdır (örn. 0.15).",
  }),
  paymentFeeRate: decimalNonNegative.refine((value) => Number(value) <= 1, {
    message: "Ödeme komisyon oranı 0-1 arasında olmalıdır.",
  }),
  otherVariableFeeRate: decimalNonNegative.refine((value) => Number(value) <= 1, {
    message: "Diğer değişken kesinti oranı 0-1 arasında olmalıdır.",
  }),
  targetMarginRate: decimalNonNegative.refine((value) => Number(value) <= 1, {
    message: "Hedef marj oranı 0-1 arasında olmalıdır.",
  }),
  fixedPerOrderCost: decimalNonNegative,
  taxMode: z.enum(["inclusive", "exclusive", "not_modelled"]).default("not_modelled"),
  commissionBase: z.enum(["gross_price", "net_price", "custom"]).default("gross_price"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CURRENCY_PATTERN, "Para birimi 3 harfli ISO 4217 kodu olmalıdır."),
  isDefault: z.boolean().nullish(),
});

export type PricingProfileInput = z.infer<typeof pricingProfileInputSchema>;
