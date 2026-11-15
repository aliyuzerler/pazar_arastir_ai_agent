/**
 * Ürün repository — TÜM fonksiyonlar workspace kapsamıyla çalışır.
 * Başka workspace'in kaydına kendi id'siyle bile erişilemez (docs/03 §2).
 */
import { and, asc, desc, eq, ilike, isNull, isNotNull, or, sql } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import { products, type Product } from "@/server/db/schema";
import type { ProductInput } from "@/server/domain/product-validation";

export type ProductSortField = "title" | "unitCost" | "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface ListProductsOptions {
  query?: string;
  category?: string;
  tracking?: boolean;
  archived?: boolean;
  sort?: ProductSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

const MAX_PAGE_SIZE = 100;

/** Repository katmanı girdisi: maliyet varsayılanları burada uygulanır. */
export type CreateProductInput = Omit<
  ProductInput,
  "inboundShippingPerUnit" | "packagingCost" | "otherFixedCost"
> & {
  inboundShippingPerUnit?: string | null;
  packagingCost?: string | null;
  otherFixedCost?: string | null;
};

function normalizeGtinForStorage(input: CreateProductInput): string | null {
  // Doğrulanmış orijinal değeri 14 haneye normalize eder.
  if (!input.gtin) return null;
  const digits = input.gtin.replace(/[\s._-]/g, "");
  return digits.padStart(14, "0");
}

function toRow(input: CreateProductInput) {
  return {
    sku: input.sku ?? null,
    title: input.title,
    brand: input.brand ?? null,
    model: input.model ?? null,
    mpn: input.mpn ?? null,
    gtin: input.gtin ?? null,
    gtinNormalized: normalizeGtinForStorage(input),
    category: input.category ?? null,
    description: input.description ?? null,
    attributes: input.attributes ?? [],
    productUrl: input.productUrl ?? null,
    imageUrl: input.imageUrl ?? null,
    unitCost: input.unitCost,
    currency: input.currency,
    inboundShippingPerUnit: input.inboundShippingPerUnit ?? "0",
    packagingCost: input.packagingCost ?? "0",
    otherFixedCost: input.otherFixedCost ?? "0",
    pricingProfileId: input.pricingProfileId ?? null,
    trackingEnabled: input.trackingEnabled ?? false,
    trackingIntervalHours: input.trackingIntervalHours ?? null,
  };
}

export async function createProduct(
  db: AppDatabase,
  workspaceId: string,
  input: CreateProductInput,
): Promise<Product> {
  const row = { ...toRow(input), workspaceId };
  const inserted = await db.insert(products).values(row).returning();
  return inserted[0];
}

export async function updateProduct(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
  input: CreateProductInput,
): Promise<Product | null> {
  const row = { ...toRow(input), updatedAt: new Date() };
  const updated = await db
    .update(products)
    .set(row)
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspaceId)))
    .returning();
  return updated[0] ?? null;
}

export async function getProduct(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
): Promise<Product | null> {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function archiveProduct(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
): Promise<Product | null> {
  const updated = await db
    .update(products)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspaceId)))
    .returning();
  return updated[0] ?? null;
}

export async function restoreProduct(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
): Promise<Product | null> {
  const updated = await db
    .update(products)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspaceId)))
    .returning();
  return updated[0] ?? null;
}

export interface ProductListResult {
  items: Product[];
  total: number;
}

export async function listProducts(
  db: AppDatabase,
  workspaceId: string,
  options: ListProductsOptions = {},
): Promise<ProductListResult> {
  const conditions = [eq(products.workspaceId, workspaceId)];
  conditions.push(options.archived ? isNotNull(products.archivedAt) : isNull(products.archivedAt));

  if (options.query && options.query.trim().length > 0) {
    const q = `%${options.query.trim()}%`;
    const searchCondition = or(
      ilike(products.title, q),
      ilike(products.brand, q),
      ilike(products.model, q),
      ilike(products.sku, q),
      ilike(products.gtin, q),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (options.category && options.category.trim().length > 0) {
    conditions.push(ilike(products.category, options.category.trim()));
  }
  if (options.tracking !== undefined) {
    conditions.push(eq(products.trackingEnabled, options.tracking));
  }

  const where = and(...conditions);
  const sortColumn =
    options.sort === "unitCost"
      ? products.unitCost
      : options.sort === "createdAt"
        ? products.createdAt
        : options.sort === "updatedAt"
          ? products.updatedAt
          : products.title;
  const orderBy = options.order === "desc" ? desc(sortColumn) : asc(sortColumn);

  const limit = Math.min(Math.max(options.limit ?? 20, 1), MAX_PAGE_SIZE);
  const offset = Math.max(options.offset ?? 0, 0);

  const [items, countRows] = await Promise.all([
    db.select().from(products).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  return { items, total: countRows[0]?.count ?? 0 };
}

/** SKU/GTIN mükerrer kontrolü (aynı workspace içinde). */
export async function findDuplicateBySkuOrGtin(
  db: AppDatabase,
  workspaceId: string,
  { sku, gtinNormalized, excludeId }: { sku?: string | null; gtinNormalized?: string | null; excludeId?: string },
): Promise<Product | null> {
  const conditions = [eq(products.workspaceId, workspaceId)];
  if (sku) {
    const bySku = await db
      .select()
      .from(products)
      .where(and(...conditions, eq(products.sku, sku)))
      .limit(1);
    if (bySku[0] && bySku[0].id !== excludeId) return bySku[0];
  }
  if (gtinNormalized) {
    const byGtin = await db
      .select()
      .from(products)
      .where(and(...conditions, eq(products.gtinNormalized, gtinNormalized)))
      .limit(1);
    if (byGtin[0] && byGtin[0].id !== excludeId) return byGtin[0];
  }
  return null;
}
