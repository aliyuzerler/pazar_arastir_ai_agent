/**
 * Örnek ürün seed'i (demo katalog). `npm run db:seed` ile idempotent
 * çalışır: SKU bazlı mükerrer kontrol sayesinde tekrar eklenmez.
 */
import { and, eq } from "drizzle-orm";

import type { AppDatabase } from "./driver";
import { monitoringJobs, products } from "./schema";

const SAMPLE_PRODUCTS = [
  {
    sku: "DEMO-001",
    title: "Kablosuz Kulaklık ANC Pro",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "8690000000012",
    gtinNormalized: "08690000000012",
    category: "Elektronik / Ses Sistemleri",
    description: "Aktif gürültü engelleme, 30 saat pil ömrü, USB-C.",
    attributes: [
      { key: "Renk", value: "Siyah" },
      { key: "Pil ömrü", value: "30 saat" },
    ],
    unitCost: "850.0000",
    currency: "TRY",
    inboundShippingPerUnit: "12.5000",
    packagingCost: "3.0000",
    otherFixedCost: "2.0000",
    trackingEnabled: true,
    trackingIntervalHours: 12,
  },
  {
    sku: "DEMO-002",
    title: "Akıllı Ev Termostatı X1",
    brand: "EvMark",
    model: "X1",
    mpn: null,
    gtin: null,
    gtinNormalized: null,
    category: "Ev Otomasyonu",
    description: "Wi-Fi termostat, uygulama desteği.",
    attributes: [
      { key: "Bağlantı", value: "Wi-Fi 2.4GHz" },
      { key: "Uyumluluk", value: "Kombi / Doğalgaz" },
    ],
    unitCost: "1240.0000",
    currency: "TRY",
    inboundShippingPerUnit: "20.0000",
    packagingCost: "5.0000",
    otherFixedCost: "3.0000",
    trackingEnabled: false,
    trackingIntervalHours: null,
  },
  {
    sku: "DEMO-003",
    title: "Portatif Projeksiyon Cihazı MiniBeam",
    brand: "GörüMark",
    model: "MiniBeam-200",
    mpn: "GM-MB200",
    gtin: "8690000000029",
    gtinNormalized: "08690000000029",
    category: "Elektronik / Görüntü",
    description: "720p, 200 lümen, HDMI + USB.",
    attributes: [{ key: "Çözünürlük", value: "1280x720" }],
    unitCost: "2150.0000",
    currency: "TRY",
    inboundShippingPerUnit: "35.0000",
    packagingCost: "8.0000",
    otherFixedCost: "4.0000",
    trackingEnabled: false,
    trackingIntervalHours: null,
  },
];

export async function ensureSampleProducts(db: AppDatabase, workspaceId: string): Promise<number> {
  let created = 0;
  for (const sample of SAMPLE_PRODUCTS) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.workspaceId, workspaceId), eq(products.sku, sample.sku)))
      .limit(1);
    if (existing.length === 0) {
      await db
        .insert(products)
        .values({ ...sample, workspaceId } as typeof products.$inferInsert);
      created += 1;
    }
  }

  // İzleme açık örnek ürün için izleme işi garanti et (idempotent).
  const tracked = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.workspaceId, workspaceId), eq(products.trackingEnabled, true)))
    .limit(1);
  if (tracked[0]) {
    // Doğrudan insert: seed, araştırma/izleme servis zincirini çekmez.
    await db
      .insert(monitoringJobs)
      .values({
        workspaceId,
        productId: tracked[0].id,
        status: "idle",
        frequencyHours: 24,
      })
      .onConflictDoNothing();
  }

  return created;
}
