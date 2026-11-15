import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { pricingProfileInputSchema } from "@/server/domain/product-validation";
import { createProfile, listProfiles } from "@/server/application/pricing-service";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const CREATE_SCHEMA = pricingProfileInputSchema.extend({ isDefault: z.boolean().nullish() });

/** GET /api/pricing-profiles — workspace profilleri. */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const profiles = await listProfiles(db, workspace.id);
  return apiOk({ profiles }, { requestId, dataMode: currentDataMode() });
}

/** POST /api/pricing-profiles — yeni profil (oransal alanlar 0-1 aralığında). */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = CREATE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      {
        code: "VALIDATION_ERROR",
        message: "Profil girdileri doğrulanamadı.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
      requestId,
    );
  }
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const profile = await createProfile(db, workspace.id, {
    name: parsed.data.name,
    marketplaceFeeRate: parsed.data.marketplaceFeeRate,
    paymentFeeRate: parsed.data.paymentFeeRate,
    otherVariableFeeRate: parsed.data.otherVariableFeeRate,
    targetMarginRate: parsed.data.targetMarginRate,
    fixedPerOrderCost: parsed.data.fixedPerOrderCost,
    taxMode: parsed.data.taxMode,
    commissionBase: parsed.data.commissionBase,
    currency: parsed.data.currency,
    isDefault: parsed.data.isDefault ?? false,
  });
  return apiOk(profile, { requestId, dataMode: currentDataMode(), status: 201 });
}
