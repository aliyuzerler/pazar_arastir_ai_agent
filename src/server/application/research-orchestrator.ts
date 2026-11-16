/**
 * ResearchOrchestrator: provider seçimi, sorgu planı, idempotency,
 * kısmi başarı ve eşleşme sınıflandırması (docs/02 §5).
 */
import { and, desc, eq } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import {
  researchRuns,
  type ResearchRun,
} from "@/server/db/schema";
import type { Product, ResearchAssistantMeta } from "@/server/db/schema";
import {
  classifyOffer,
  type MatchDecision,
} from "@/server/domain/matching";
import { upsertMatch, upsertOffer } from "@/server/db/repositories/offer-repository";
import { recordObservationsFromResearch } from "@/server/application/price-history-service";
import {
  createProviders,
  runProviderSearch,
} from "@/server/providers/registry";
import {
  getResearchAssistantStatus,
  suggestQueries,
  summarizeFindings,
  type AssistantOutcome,
  type AssistantSummaryData,
} from "@/server/ai/research-assistant";
import type {
  NormalizedOffer,
  ProviderPricePoint,
  ProviderProductContext,
} from "@/server/providers/contracts";

export function buildQueryPlan(product: Product): string[] {
  const queries: string[] = [];
  if (product.gtinNormalized) queries.push(product.gtinNormalized);
  if (product.mpn && product.brand) queries.push(`${product.brand} ${product.mpn}`);
  if (product.brand && product.model) queries.push(`${product.brand} ${product.model}`);
  queries.push(product.title);
  return queries;
}

/** Sorgu planını AI önerileriyle birleştirir; tekrarları atar, uzunluğu sınırlar. */
const MAX_QUERY_PLAN = 8;

function mergeQueryPlan(base: string[], suggestions: string[]): string[] {
  const seen = new Set(base.map((query) => query.trim().toLocaleLowerCase("tr-TR")));
  const merged = [...base];
  for (const query of suggestions) {
    const key = query.trim().toLocaleLowerCase("tr-TR");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(query);
    if (merged.length >= MAX_QUERY_PLAN) break;
  }
  return merged;
}

function toProviderContext(product: Product): ProviderProductContext {
  return {
    title: product.title,
    brand: product.brand,
    model: product.model,
    mpn: product.mpn,
    gtin: product.gtinNormalized,
    category: product.category,
    attributes: product.attributes,
  };
}

export interface RunResearchOptions {
  idempotencyKey?: string;
  providerIds?: string[];
}

export interface RunResearchResult {
  run: ResearchRun;
  duplicate: boolean;
}

export async function runResearch(
  db: AppDatabase,
  workspaceId: string,
  product: Product,
  options: RunResearchOptions = {},
): Promise<RunResearchResult> {
  // Idempotency: aynı key + workspace → mevcut koşuyu döndür.
  if (options.idempotencyKey) {
    const existing = await db
      .select()
      .from(researchRuns)
      .where(
        and(
          eq(researchRuns.workspaceId, workspaceId),
          eq(researchRuns.idempotencyKey, options.idempotencyKey),
        ),
      )
      .limit(1);
    if (existing[0]) return { run: existing[0], duplicate: true };
  }

  const providers = createProviders().filter((provider) => provider.isConfigured());
  const requestedIds = providers.map((provider) => provider.id);

  // AI asistan (opsiyonel): sorgu planını genişletir; her hata zarifçe düşer
  // ve araştırma akışını asla engellemez (docs/02 §9).
  const assistant = getResearchAssistantStatus();
  const baseQueryPlan = buildQueryPlan(product);
  let assistantQueries: string[] = [];
  let assistantQueryLatencyMs = 0;
  if (assistant.configured) {
    const suggestionStartedAt = Date.now();
    try {
      const suggestion = await suggestQueries({
        product: toProviderContext(product),
        existingQueries: baseQueryPlan,
      });
      if (suggestion.ok) assistantQueries = suggestion.data;
    } catch {
      // asistan hatası araştırmayı engellemez
    }
    assistantQueryLatencyMs = Date.now() - suggestionStartedAt;
  }
  const queryPlan = mergeQueryPlan(baseQueryPlan, assistantQueries);

  const inserted = await db
    .insert(researchRuns)
    .values({
      workspaceId,
      productId: product.id,
      status: "queued",
      queryPlan,
      providersRequested: requestedIds,
      idempotencyKey: options.idempotencyKey ?? null,
      startedAt: new Date(),
    })
    .returning();
  let run = inserted[0];

  await db.update(researchRuns).set({ status: "running" }).where(eq(researchRuns.id, run.id));
  run = { ...run, status: "running" };

  const outcomes = await runProviderSearch(
    {
      product: toProviderContext(product),
      queryVariants: buildQueryPlan(product),
      country: "TR",
      locale: "tr-TR",
      currency: product.currency,
      maxResults: 50,
    },
    { providerIds: options.providerIds },
  );

  let total = 0;
  let exact = 0;
  let substitutes = 0;
  const providerErrors: { providerId: string; kind: string; message: string }[] = [];
  const offerRowIds = new Map<string, string>();
  const collectedOffers: NormalizedOffer[] = [];
  const collectedHistory: ProviderPricePoint[] = [];

  for (const outcome of outcomes) {
    if (outcome.error) {
      providerErrors.push({ providerId: outcome.providerId, ...outcome.error });
      continue;
    }
    const result = outcome.result!;
    for (const offer of result.offers) {
      const upserted = await upsertOffer(db, workspaceId, product.id, offer);
      offerRowIds.set(offer.providerOfferId, upserted.id);
      collectedOffers.push(offer);
      const decision: MatchDecision = classifyOffer(
        toProviderContext(product),
        offer,
      );
      await upsertMatch(db, workspaceId, product.id, upserted.id, decision);
      total += 1;
      if (decision.matchType === "exact") exact += 1;
      if (decision.matchType === "substitute") substitutes += 1;
    }
    collectedHistory.push(...result.historicalPrices);
  }

  // Her başarılı koşu fiyat/bulunabilirlik gözlemi üretir (dedupe ile).
  await recordObservationsFromResearch(
    db,
    workspaceId,
    product.id,
    collectedOffers,
    offerRowIds,
    collectedHistory,
  );

  const succeeded = outcomes.filter((outcome) => !outcome.error).length;
  const status = succeeded === 0 ? "failed" : succeeded === outcomes.length ? "completed" : "partial";

  // AI asistan Türkçe özeti (opsiyonel): modele fiyatsız teklif kesiti gider,
  // çıktı Zod şemasıyla doğrulanır; hata koşu statüsünü değiştirmez.
  let assistantMeta: ResearchAssistantMeta | null = null;
  if (assistant.configured) {
    const summaryStartedAt = Date.now();
    if (collectedOffers.length === 0) {
      assistantMeta = {
        model: assistant.model,
        status: "ok",
        queriesAdded: assistantQueries.length,
        latencyMs: assistantQueryLatencyMs,
      };
    } else {
      let summary: AssistantOutcome<AssistantSummaryData>;
      try {
        summary = await summarizeFindings({
          product: toProviderContext(product),
          offers: collectedOffers,
        });
      } catch {
        summary = { ok: false, reason: "unknown" };
      }
      const latencyMs = assistantQueryLatencyMs + (Date.now() - summaryStartedAt);
      assistantMeta = summary.ok
        ? {
            model: assistant.model,
            status: "ok",
            queriesAdded: assistantQueries.length,
            summary: summary.data.summary,
            substituteNotes: summary.data.substituteNotes,
            latencyMs,
          }
        : {
            model: assistant.model,
            status: "unavailable",
            reason: summary.reason,
            queriesAdded: assistantQueries.length,
            latencyMs,
          };
    }
  }

  const updated = await db
    .update(researchRuns)
    .set({
      status,
      assistant: assistantMeta,
      providerErrors,
      totalResults: total,
      exactCount: exact,
      substituteCount: substitutes,
      errorSummary:
        providerErrors.length > 0
          ? providerErrors.map((error) => `${error.providerId}: ${error.message}`).join(" | ")
          : null,
      completedAt: new Date(),
    })
    .where(eq(researchRuns.id, run.id))
    .returning();

  return { run: updated[0], duplicate: false };
}

export async function getResearchRun(
  db: AppDatabase,
  workspaceId: string,
  runId: string,
): Promise<ResearchRun | null> {
  const rows = await db
    .select()
    .from(researchRuns)
    .where(and(eq(researchRuns.id, runId), eq(researchRuns.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listResearchRuns(
  db: AppDatabase,
  workspaceId: string,
  productId?: string,
  limit = 20,
): Promise<ResearchRun[]> {
  const conditions = [eq(researchRuns.workspaceId, workspaceId)];
  if (productId) conditions.push(eq(researchRuns.productId, productId));
  return db
    .select()
    .from(researchRuns)
    .where(and(...conditions))
    .orderBy(desc(researchRuns.createdAt))
    .limit(limit);
}
