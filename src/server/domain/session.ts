/**
 * Oturum: httpOnly çerezde HS256 JWT (jose — edge uyumlu). Middleware yalnızca
 * imzayı doğrular; kullanıcı/workspace geçerliliği her istekte DB'den
 * teyit edilir (security-multitenant: derin doğrulama uygulama katmanında).
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "pi_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const DEV_SECRET = "dev-session-secret-change-me";

function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? DEV_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionClaims extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  wid: string;
}

export async function createSessionToken(claims: Pick<SessionClaims, "sub" | "email" | "role" | "wid">): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role, wid: claims.wid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.wid !== "string") {
      return null;
    }
    return payload as SessionClaims;
  } catch {
    return null;
  }
}
