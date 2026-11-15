import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import {
  importCsv,
  previewCsvImport,
} from "@/server/application/product-service";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const IMPORT_SCHEMA = z.object({
  csv: z.string().min(1, "CSV içeriği boş olamaz.").max(512 * 1024, "CSV çok büyük (maks 512 KB)."),
  dryRun: z.boolean().default(true),
});

/**
 * POST /api/products/import — CSV önizleme (dryRun=true) veya içe aktarma.
 * Yalnızca geçerli satırlar kalıcı hale gelir; hata raporu satır bazlıdır.
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }

  const parsed = IMPORT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      {
        code: "VALIDATION_ERROR",
        message: "İçe aktarma isteği doğrulanamadı.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
      requestId,
    );
  }

  try {
    const { workspace } = await resolveWorkspaceContext();
    if (parsed.data.dryRun) {
      const preview = previewCsvImport(parsed.data.csv);
      return apiOk(preview, { requestId, dataMode: currentDataMode() });
    }
    const db = getDb();
    const result = await importCsv(db, workspace.id, parsed.data.csv);
    return apiOk(result, { requestId, dataMode: currentDataMode() });
  } catch (error) {
    return serviceErrorResponse(
      { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "İçe aktarma başarısız." },
      requestId,
    );
  }
}
