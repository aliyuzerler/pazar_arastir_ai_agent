/**
 * Provider kayıt fabrikası ve durum raporlama.
 * Anahtarlar yalnızca sunucu env'inden okunur; istemciye asla dönmez.
 */
import "server-only";

import { getEnv } from "@/lib/env";
import type {
  ProductResearchProvider,
  ProviderSearchInput,
  ProviderSearchResult,
  ProviderStatus,
  ProviderStatusKind,
} from "./contracts";
import { ProviderError } from "./contracts";
import { createDemoProvider } from "./demo/demo-provider";
import { createDataForSeoProvider, isDataForSeoConfigured } from "./dataforseo/dataforseo-provider";

/** Tüm bilinen sağlayıcılar (demo daima ilk sırada). */
export function createProviders(): ProductResearchProvider[] {
  return [createDemoProvider(), createDataForSeoProvider()];
}

export function getProviderStatuses(): ProviderStatus[] {
  const env = getEnv();
  return createProviders().map((provider) => {
    let status: ProviderStatusKind = "ready";
    if (!provider.isConfigured()) status = "not_configured";
    if (provider.id === "dataforseo" && env.PROVIDER_MODE === "demo") {
      // Demo modda canlı sağlayıcı bilinçli olarak devre dışı işaretlenir.
      status = provider.isConfigured() ? "disabled" : "not_configured";
    }
    return {
      id: provider.id,
      displayName: provider.displayName,
      status,
      isDemo: provider.isDemo,
      requiredEnvVars:
        provider.id === "dataforseo" ? ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"] : [],
      capabilities: provider.capabilities,
    };
  });
}

export interface ProviderRunOutcome {
  providerId: string;
  result?: ProviderSearchResult;
  error?: { kind: string; message: string };
}

/**
 * Tüm aktif sağlayıcıları paralel çağırır; bir kaynağın hatası diğerlerini
 * etkilemez (TEST_03 md-9, docs/02 §7). Hata mesajları sanitised.
 */
export async function runProviderSearch(
  input: ProviderSearchInput,
  options: { providerIds?: string[] } = {},
): Promise<ProviderRunOutcome[]> {
  const providers = createProviders().filter(
    (provider) =>
      provider.isConfigured() && (options.providerIds ? options.providerIds.includes(provider.id) : true),
  );

  const settled = await Promise.allSettled(
    providers.map(async (provider) => ({
      providerId: provider.id,
      result: await provider.search(input),
    })),
  );

  return settled.map((entry, index) => {
    const providerId = providers[index].id;
    if (entry.status === "fulfilled") return entry.value;
    const reason = entry.reason;
    if (reason instanceof ProviderError) {
      return { providerId, error: { kind: reason.kind, message: reason.message } };
    }
    return { providerId, error: { kind: "unknown", message: "Bilinmeyen sağlayıcı hatası." } };
  });
}
