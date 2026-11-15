/**
 * Bağımlılıksız CSV ayrıştırıcı (RFC 4180 uyumlu temel davranış: tırnaklı
 * alan, kaçırılmış tırnak, virgül ve satır sonu). Faz 5 dışa aktarımında
 * formula-injection nötralizasyonu da burada yaşar.
 */
export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  errors: string[];
}

export const CSV_IMPORT_MAX_ROWS = 500;
export const CSV_IMPORT_MAX_BYTES = 512 * 1024;

export function parseCsv(input: string): CsvParseResult {
  const errors: string[] = [];
  const rows: string[][] = [];
  let headers: string[] = [];

  if (input.length > CSV_IMPORT_MAX_BYTES) {
    return {
      headers: [],
      rows: [],
      errors: [`CSV dosyası çok büyük (en fazla ${Math.floor(CSV_IMPORT_MAX_BYTES / 1024)} KB).`],
    };
  }

  const text = input.replace(/^\uFEFF/, ""); // BOM temizle
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;
  let sawAnyField = false;

  function endField() {
    currentRow.push(currentField);
    currentField = "";
    sawAnyField = true;
  }

  function endRow() {
    if (currentField.length > 0 || sawAnyField) endField();
    if (currentRow.length > 0) rows.push(currentRow);
    currentRow = [];
    sawAnyField = false;
  }

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      endField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      endRow();
    } else {
      currentField += ch;
    }
  }
  if (inQuotes) errors.push("Kapatılmamış tırnak işareti var.");
  endRow();

  if (rows.length === 0) {
    errors.push("CSV boş görünüyor; en az başlık satırı gerekir.");
    return { headers, rows, errors };
  }

  headers = rows[0].map((h) => h.trim());
  if (rows.length === 1) {
    errors.push("Başlık satırından sonra veri satırı yok.");
  }
  return { headers, rows: rows.slice(1), errors };
}

/** CSV hücresini dışa aktarım için güvenle neutralize eder (=,+,-,@ ile başlayan formül). */
export function neutralizeCsvCell(value: string): string {
  const v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) {
    return `'${v}`;
  }
  return v;
}

export type CsvHeaderField =
  | "title"
  | "sku"
  | "brand"
  | "model"
  | "mpn"
  | "gtin"
  | "category"
  | "description"
  | "productUrl"
  | "imageUrl"
  | "unitCost"
  | "currency"
  | "inboundShippingPerUnit"
  | "packagingCost"
  | "otherFixedCost";

const HEADER_ALIASES: Record<CsvHeaderField, string[]> = {
  title: ["title", "urun_adi", "ürün adı", "urunadi", "başlık", "baslik", "product_name"],
  sku: ["sku", "stok_kodu", "stock code", "stokkodu"],
  brand: ["brand", "marka"],
  model: ["model"],
  mpn: ["mpn", "uretici_kodu", "üretici kodu"],
  gtin: ["gtin", "ean", "upc", "barkod"],
  category: ["category", "kategori"],
  description: ["description", "açıklama", "aciklama"],
  productUrl: ["product_url", "urun_url", "ürün url", "url"],
  imageUrl: ["image_url", "gorsel_url", "görsel url", "resim"],
  unitCost: ["unit_cost", "alis_fiyati", "alış fiyatı", "maliyet", "birim maliyet", "birim_maliyet"],
  currency: ["currency", "para_birimi", "para birimi", "doviz", "döviz"],
  inboundShippingPerUnit: [
    "inbound_shipping_per_unit",
    "giris_kargo",
    "giriş kargo",
    "tedarik_kargo",
  ],
  packagingCost: ["packaging_cost", "paketleme", "paketleme_maliyeti"],
  otherFixedCost: ["other_fixed_cost", "diger_sabit_maliyet", "diğer sabit maliyet"],
};

/** Başlıkları bilinen takma adlarla eşleştirir; eksik zorunlu alanları döndürür. */
export function mapCsvHeaders(
  headers: string[],
): { mapping: Map<number, CsvHeaderField>; missing: string[] } {
  const mapping = new Map<number, CsvHeaderField>();
  const lower = headers.map((h) => h.trim().toLowerCase());
  (Object.keys(HEADER_ALIASES) as CsvHeaderField[]).forEach((field) => {
    const index = lower.findIndex((h) => HEADER_ALIASES[field].includes(h));
    if (index >= 0 && !mapping.has(index)) {
      mapping.set(index, field);
    }
  });
  const mapped = new Set(mapping.values());
  const missing: string[] = [];
  if (!mapped.has("title")) missing.push("title (ürün adı)");
  if (!mapped.has("unitCost")) missing.push("unit_cost (maliyet)");
  if (!mapped.has("currency")) missing.push("currency (para birimi)");
  return { mapping, missing };
}
