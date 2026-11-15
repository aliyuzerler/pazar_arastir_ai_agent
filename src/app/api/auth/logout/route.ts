import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/server/application/auth-service";
import { getRequestId } from "@/server/http/route-helpers";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — oturum çerezini siler. */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const response = NextResponse.json(
    { data: { ok: true }, meta: { requestId, dataMode: "demo" } },
    { status: 200 },
  );
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
