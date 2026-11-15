/**
 * Kenar (edge) kimlik doğrulama kapısı.
 * - Korumalı sayfalara oturumsuz girişte /login'e yönlendirir.
 * - Korumalı API'lere oturumsuz girişte 401 zarfı döner.
 * - /admin* yalnızca admin rolüne açıktır.
 * - İstisnalar: auth uçları, cron (kendi secret'ı), health, statik.
 * Kenar katmanında yalnızca JWT imzası doğrulanır; kullanıcı/workspace
 * geçerliliği uygulama katmanında DB'den teyit edilir.
 */
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/server/domain/session";

const PUBLIC_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const PUBLIC_API = ["/api/auth", "/api/cron", "/api/health"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  if (PUBLIC_API.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Oturum gerekli." } },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && claims.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Bu işlem için admin yetkisi gerekir." } },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
