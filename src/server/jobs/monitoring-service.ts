/**
 * MonitoringWorker: due işleri kilitli, sınırlı toplu çalıştırır; araştırma
 * sonrası fiyat/bulunabilirlik değişiminden uyarı üretir; kota koruması var.
 */
import { and, asc, desc, eq, isNull, lt, or, sql } from "drizzle-orm";

import { getEnv } from "@/lib/env";
import type { AppDatabase } from "@/server/db/driver";
import {
  alerts,
  monitoringJobs,
  priceObservations,
  providerQuotaUsage,
  type MonitoringJob,
} from "@/server/db/schema";
import { products } from "@/server/db/schema";
import { evaluateAlerts } from "@/server/domain/monitoring";
import { runResearch } from "@/server/application/research-orchestrator";

const LOCK_MINUTES = 5;
const BATCH_LIMIT = 5;
const RETRY_MINUTES = 15;

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Kota kontrolü: günlük bütçe dolduysa iş başlatılmaz (TEST_07 md-9). */
export async function checkQuota(db: AppDatabase, workspaceId: string, providerId: string): Promise<boolean> {
  const budget = Number(getEnv().MAX_DAILY_QUERIES ?? 200);
  const rows = await db
    .select()
    .from(providerQuotaUsage)
    .where(
      and(
        eq(providerQuotaUsage.workspaceId, workspaceId),
        eq(providerQuotaUsage.providerId, providerId),
        eq(providerQuotaUsage.day, todayKey()),
      ),
    )
    .limit(1);
  return (rows[0]?.usedQueries ?? 0) < budget;
}

export async function incrementQuota(db: AppDatabase, workspaceId: string, providerId: string): Promise<void> {
  await db
    .insert(providerQuotaUsage)
    .values({ workspaceId, providerId, day: todayKey(), usedQueries: 1 })
    .onConflictDoUpdate({
      target: [providerQuotaUsage.workspaceId, providerQuotaUsage.providerId, providerQuotaUsage.day],
      set: { usedQueries: sql`${providerQuotaUsage.usedQueries} + 1` },
    });
}

/** Vadesi gelen, kilitsiz işleri claim eder (bounded batch). */
export async function claimDueJobs(db: AppDatabase, limit = BATCH_LIMIT): Promise<MonitoringJob[]> {
  const now = new Date();
  const lockCutoff = new Date(now.getTime() - LOCK_MINUTES * 60_000);
  const candidates = await db
    .select()
    .from(monitoringJobs)
    .where(
      and(
        or(eq(monitoringJobs.status, "idle"), eq(monitoringJobs.status, "failed")),
        lt(monitoringJobs.nextRunAt, now),
        or(isNull(monitoringJobs.lockUntil), lt(monitoringJobs.lockUntil, lockCutoff)),
      ),
    )
    .orderBy(asc(monitoringJobs.nextRunAt))
    .limit(limit);

  const claimed: MonitoringJob[] = [];
  for (const job of candidates) {
    const locked = await db
      .update(monitoringJobs)
      .set({
        status: "running",
        lockUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000),
        updatedAt: now,
      })
      .where(and(eq(monitoringJobs.id, job.id), or(isNull(monitoringJobs.lockUntil), lt(monitoringJobs.lockUntil, lockCutoff))))
      .returning();
    if (locked[0]) claimed.push(locked[0]);
  }
  return claimed;
}

function medianPrice(rows: { priceAmount: string }[]): number | null {
  if (rows.length === 0) return null;
  const sorted = rows.map((row) => Number(row.priceAmount)).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Tek işi çalıştır: araştır + önceki gözlemle karşılaştır + uyarı yaz. */
export async function runMonitoringJob(db: AppDatabase, job: MonitoringJob): Promise<{ alertsCreated: number }> {
  const productRows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, job.productId), eq(products.workspaceId, job.workspaceId)))
    .limit(1);
  const product = productRows[0];
  if (!product) throw new Error("İzlenen ürün bulunamadı.");

  if (!(await checkQuota(db, job.workspaceId, "demo"))) {
    throw new Error("Günlük sağlayıcı sorgu bütçesi doldu; iş ertelendi.");
  }

  // Önceki referans gözlem (herhangi bir teklifin medyan fiyatı + ilk stok durumu)
  const previousRows = await db
    .select()
    .from(priceObservations)
    .where(and(eq(priceObservations.productId, job.productId), eq(priceObservations.sourceKind, "our_snapshot")))
    .orderBy(desc(priceObservations.observedAt))
    .limit(20);
  const previousMedian = medianPrice(previousRows);
  const previousAvailability = previousRows[0]?.availabilityStatus ?? "unknown";

  const { run } = await runResearch(db, job.workspaceId, product, {
    idempotencyKey: `monitor-${job.id}-${new Date().toISOString().slice(0, 13)}`, // saatlik idempotency
  });
  await incrementQuota(db, job.workspaceId, "demo");

  // Son gözlemlerle karşılaştır
  const latestRows = await db
    .select()
    .from(priceObservations)
    .where(and(eq(priceObservations.productId, job.productId), eq(priceObservations.sourceKind, "our_snapshot")))
    .orderBy(desc(priceObservations.observedAt))
    .limit(20);
  const currentMedian = medianPrice(latestRows);
  const currentAvailability = latestRows[0]?.availabilityStatus ?? "unknown";

  let alertsCreated = 0;
  if (previousMedian !== null && currentMedian !== null) {
    const candidates = evaluateAlerts(
      { priceAmount: String(previousMedian), availabilityStatus: previousAvailability },
      { priceAmount: String(currentMedian), availabilityStatus: currentAvailability },
      { thresholdPercent: 5 },
    );
    for (const candidate of candidates) {
      await db.insert(alerts).values({
        workspaceId: job.workspaceId,
        productId: job.productId,
        type: candidate.type,
        thresholdPercent: candidate.thresholdPercent !== null ? String(candidate.thresholdPercent) : null,
        oldPrice: previousMedian !== null ? String(previousMedian.toFixed(4)) : null,
        newPrice: currentMedian !== null ? String(currentMedian.toFixed(4)) : null,
        currency: product.currency,
        message: candidate.message,
        isDemo: true, // bu ortamdaki sağlayıcı demo (canlı veri gelince false olur)
      });
      alertsCreated += 1;
    }
  }

  await db
    .update(monitoringJobs)
    .set({
      status: "idle",
      lastRunAt: new Date(),
      nextRunAt: new Date(Date.now() + job.frequencyHours * 3_600_000),
      lockUntil: null,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(monitoringJobs.id, job.id));

  return { alertsCreated };
}

/** Bir batch çalıştırır (worker/cron ortak). Hata işi failed yapar, retry planlar. */
export async function runMonitoringBatch(db: AppDatabase): Promise<{ processed: number; alertsCreated: number; errors: string[] }> {
  const jobs = await claimDueJobs(db);
  const errors: string[] = [];
  let alertsCreated = 0;

  for (const job of jobs) {
    try {
      const result = await runMonitoringJob(db, job);
      alertsCreated += result.alertsCreated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "bilinmeyen hata";
      errors.push(`${job.productId.slice(0, 8)}: ${message}`);
      await db
        .update(monitoringJobs)
        .set({
          status: "failed",
          lastError: message.slice(0, 500),
          nextRunAt: new Date(Date.now() + RETRY_MINUTES * 60_000),
          lockUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(monitoringJobs.id, job.id));
    }
  }
  return { processed: jobs.length, alertsCreated, errors };
}

/** Ürün için izleme işini garanti eder (upsert) ve tracking bayrağını senkronlar. */
export async function upsertMonitoringJob(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
  { trackingEnabled, frequencyHours }: { trackingEnabled: boolean; frequencyHours?: number },
): Promise<MonitoringJob> {
  const safeFrequency = Math.max(Math.min(frequencyHours ?? 24, 168), 6);
  const existing = await db
    .select()
    .from(monitoringJobs)
    .where(eq(monitoringJobs.productId, productId))
    .limit(1);

  if (existing[0]) {
    const updated = await db
      .update(monitoringJobs)
      .set({
        status: trackingEnabled ? "idle" : "paused",
        frequencyHours: safeFrequency,
        nextRunAt: trackingEnabled ? new Date() : existing[0].nextRunAt,
        updatedAt: new Date(),
      })
      .where(eq(monitoringJobs.id, existing[0].id))
      .returning();
    return updated[0];
  }

  const inserted = await db
    .insert(monitoringJobs)
    .values({ workspaceId, productId, status: trackingEnabled ? "idle" : "paused", frequencyHours: safeFrequency })
    .returning();
  return inserted[0];
}

export async function listJobsWithProducts(db: AppDatabase, workspaceId: string) {
  return db
    .select({ job: monitoringJobs, product: products })
    .from(monitoringJobs)
    .innerJoin(products, eq(monitoringJobs.productId, products.id))
    .where(eq(monitoringJobs.workspaceId, workspaceId))
    .orderBy(desc(monitoringJobs.nextRunAt));
}

export async function listAlerts(db: AppDatabase, workspaceId: string, limit = 50) {
  return db
    .select({ alert: alerts, product: products })
    .from(alerts)
    .innerJoin(products, eq(alerts.productId, products.id))
    .where(eq(alerts.workspaceId, workspaceId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}
