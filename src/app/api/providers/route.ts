import type { NextRequest } from "next/server";

import { apiOk, getRequestId } from "@/server/http/route-helpers";
import { getProviderStatuses } from "@/server/providers/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/providers — sağlayıcı durum listesi. Anahtar asla dönmez;
 * yalnızca hangi env değişkenlerinin beklendiği bildirilir.
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  return apiOk(
    {
      providers: getProviderStatuses(),
    },
    { requestId, dataMode: "demo" },
  );
}
