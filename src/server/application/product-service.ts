/**
 * Ürün servisi: doğrulama, mükerrer kontrol ve CSV içe aktarma akışı.
 */
import { z } from "zod";

import { parseCsv, mapCsvHeaders, CSV_IMPORT_MAX_ROWS } from "@/server/domain/csv";
import {
  productInputSchema,
  type ProductInput,
} from "@/server/domain/product-validation";
import { normalizeGtin } from "@/server/domain/gtin";
import type { AppDatabase } from "@/server/db/driver";
import {
  createProduct,
  findDuplicateBySkuOrGtin,
  type CreateProductInput,
} from "@/server/db/repositories/product-repository";
import type { Product } from "@/server/db/schema";

export interface ServiceError {
  code: "VALIDATION_ERROR" | "DUPLICATE" | "NOT_FOUND";
  message: string;
  details?: unknown[];
}

/** Zod şemasından ProductInput'a dönüşüm; hata varsa ServiceError fırlatır. */
export function parseProductInput(payload: unknown): ProductInput {
  const result = productInputSchema.safeParse(payload);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.map(String).join(".") || "(kök)",
      message: issue.message,
    }));
    throw {
      code: "VALIDATION_ERROR",
      message: "Ürün girdileri doğrulanamadı.",
      details,
    } satisfies ServiceError;
  }
  return result.data;
}

export async function createProductChecked(
  db: AppDatabase,
  workspaceId: string,
  input: CreateProductInput,
): Promise<Product> {
  const duplicate = await findDuplicateBySkuOrGtin(db, workspaceId, {
    sku: input.sku ?? null,
    gtinNormalized: input.gtin ? normalizeGtin(input.gtin).normalized : null,
  });
  if (duplicate) {
    throw {
      code: "DUPLICATE",
      message: "Aynı SKU veya GTIN ile kayıtlı ürün var.",
      details: [{ path: "sku/gtin", message: duplicate.title }],
    } satisfies ServiceError;
  }
  return createProduct(db, workspaceId, input);
}

export async function updateProductChecked(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
  input: ProductInput,
  updateFn: (productId: string, input: CreateProductInput) => Promise<Product | null>,
): Promise<Product | null> {
  const duplicate = await findDuplicateBySkuOrGtin(db, workspaceId, {
    sku: input.sku ?? null,
    gtinNormalized: input.gtin ? normalizeGtin(input.gtin).normalized : null,
    excludeId: productId,
  });
  if (duplicate) {
    throw {
      code: "DUPLICATE",
      message: "Girilen SKU veya GTIN başka ürüne ait.",
      details: [{ path: "sku/gtin", message: duplicate.title }],
    } satisfies ServiceError;
  }
  return updateFn(productId, input);
}

// ---------------------------------------------------------------------------
// CSV içe aktarma
// ---------------------------------------------------------------------------

export interface CsvRowPreview {
  rowNumber: number;
  status: "valid" | "error";
  errors: string[];
  product?: ProductInput;
}

export interface CsvImportPreview {
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: CsvRowPreview[];
  missingHeaders: string[];
}

/** CSV metnini doğrular; kalıcı yazma yapmaz (önizleme). */
export function previewCsvImport(csvText: string): CsvImportPreview {
  const parsed = parseCsv(csvText);
  if (parsed.errors.length > 0) {
    return {
      totalRows: 0,
      validCount: 0,
      errorCount: 0,
      rows: [],
      missingHeaders: [],
    };
  }
  const { mapping, missing } = mapCsvHeaders(parsed.headers);

  if (parsed.rows.length > CSV_IMPORT_MAX_ROWS) {
    return {
      totalRows: parsed.rows.length,
      validCount: 0,
      errorCount: 0,
      rows: [
        {
          rowNumber: 1,
          status: "error",
          errors: [`Satır sayısı limiti aşıyor (en fazla ${CSV_IMPORT_MAX_ROWS}).`],
        },
      ],
      missingHeaders: missing,
    };
  }

  const previews: CsvRowPreview[] = parsed.rows.map((row, index) => {
    const record: Record<string, string> = {};
    mapping.forEach((field, columnIndex) => {
      record[field] = row[columnIndex] ?? "";
    });
    const result = productInputSchema.safeParse(record);
    if (result.success) {
      return { rowNumber: index + 2, status: "valid" as const, errors: [], product: result.data };
    }
    return {
      rowNumber: index + 2,
      status: "error" as const,
      errors: result.error.issues.map((issue) => {
        const path = issue.path.map(String).join(".");
        return `${path ? path + ": " : ""}${issue.message}`;
      }),
    };
  });

  return {
    totalRows: previews.length,
    validCount: previews.filter((p) => p.status === "valid").length,
    errorCount: previews.filter((p) => p.status === "error").length,
    rows: previews,
    missingHeaders: missing,
  };
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** Sadece geçerli satırları kalıcı yazar; hatalı satırları raporlar. */
export async function importCsv(
  db: AppDatabase,
  workspaceId: string,
  csvText: string,
): Promise<CsvImportResult> {
  const preview = previewCsvImport(csvText);
  const errors: string[] = [];
  if (preview.missingHeaders.length > 0) {
    return { imported: 0, skipped: 0, errors: [`Eksik başlık(lar): ${preview.missingHeaders.join(", ")}`] };
  }

  let imported = 0;
  let skipped = 0;
  for (const row of preview.rows) {
    if (row.status !== "valid" || !row.product) {
      skipped += 1;
      errors.push(`Satır ${row.rowNumber}: ${row.errors.join(" | ")}`);
      continue;
    }
    try {
      await createProductChecked(db, workspaceId, row.product);
      imported += 1;
    } catch (error) {
      skipped += 1;
      const serviceError = error as ServiceError;
      errors.push(`Satır ${row.rowNumber}: ${serviceError.message ?? "kayıt başarısız"}`);
    }
  }
  return { imported, skipped, errors };
}

// Zod'u burada da referans ver (tip çıkarımı ve gelecekteki şema birleşimleri için)
export const csvImportRequestSchema = z.object({
  csv: z.string().min(1, "CSV içeriği boş olamaz."),
  dryRun: z.boolean().default(true),
});
