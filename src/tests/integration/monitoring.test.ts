import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { eq } from "drizzle-orm";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import { createProduct } from "@/server/db/repositories/product-repository";
import {
  claimDueJobs,
  runMonitoringBatch,
  upsertMonitoringJob,
} from "@/server/jobs/monitoring-service";
import { monitoringJobs, products, workspaces } from "@/server/db/schema";

/**
 * Entegrasyon (TEST_07): tekrarlı job, kilit, provider hatası ve
 * bounded batch davranışı pglite üzerinde.
 */
const db = createDb("pglite");

let workspaceId = "";
let productId = "";

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(products);
  await db.delete(workspaces);
  const ws = await db.insert(workspaces).values({ name: "A", slug: "m-ws" }).returning();
  workspaceId = ws[0].id;
  const product = await createProduct(db, workspaceId, {
    title: "SesMark ANC Pro Kablosuz Kulaklık",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "8690000000012",
    currency: "TRY",
    unitCost: "850",
    trackingEnabled: true,
    trackingIntervalHours: 24,
  });
  productId = product.id;
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("monitoring işleri", () => {
  it("upsert idempotenttir: tekrar çağrı çift job üretmez", async () => {
    await upsertMonitoringJob(db, workspaceId, productId, { trackingEnabled: true, frequencyHours: 24 });
    await upsertMonitoringJob(db, workspaceId, productId, { trackingEnabled: true, frequencyHours: 12 });
    const jobs = await db.select().from(monitoringJobs);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].frequencyHours).toBe(12);
  });

  it("claim kilitli: aynı tick'te ikinci claim işi yeniden alamaz", async () => {
    const first = await claimDueJobs(db);
    expect(first.length).toBe(1);
    const second = await claimDueJobs(db);
    expect(second.length).toBe(0);
    // Kilidi temizle (test devamı için)
    await db.update(monitoringJobs).set({ lockUntil: null, status: "idle", nextRunAt: new Date(0) });
  });

  it("paused iş claim edilmez", async () => {
    await upsertMonitoringJob(db, workspaceId, productId, { trackingEnabled: false });
    const jobs = await db.select().from(monitoringJobs).where(eq(monitoringJobs.productId, productId));
    expect(jobs[0].status).toBe("paused");
    const claimed = await claimDueJobs(db);
    expect(claimed.find((job) => job.productId === productId)).toBeUndefined();
  });

  it("batch çalışır: araştırma tamamlanır ve iş planlanır", async () => {
    await upsertMonitoringJob(db, workspaceId, productId, { trackingEnabled: true, frequencyHours: 6 });
    await db.update(monitoringJobs).set({ nextRunAt: new Date(0), lockUntil: null, status: "idle" });
    const result = await runMonitoringBatch(db);
    expect(result.processed).toBe(1);
    expect(result.errors).toHaveLength(0);

    const jobs = await db.select().from(monitoringJobs).where(eq(monitoringJobs.productId, productId));
    expect(jobs[0].status).toBe("idle");
    expect(jobs[0].lastRunAt).not.toBeNull();
    expect(jobs[0].nextRunAt.getTime()).toBeGreaterThan(Date.now());
  });
});
