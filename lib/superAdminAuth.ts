import { createHash, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SUPER_ADMIN_COOKIE = "super_admin_session";
export const SUPER_ADMIN_SESSION_SECONDS = 8 * 60 * 60; // 8 hours

export type SuperAdminSession = {
  email: string;
};

type SuperAdminConfig = {
  email: string;
  password: string;
  jwtSecret: Uint8Array;
};

function timingSafeEqualUtf8(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}

function readConfig(): SuperAdminConfig | null {
  const emailRaw = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const jwtSecretRaw = process.env.SUPER_ADMIN_JWT_SECRET;

  if (
    typeof emailRaw !== "string" ||
    !emailRaw.trim() ||
    typeof password !== "string" ||
    password.length === 0 ||
    typeof jwtSecretRaw !== "string" ||
    !jwtSecretRaw.trim()
  ) {
    return null;
  }

  return {
    email: emailRaw.trim().toLowerCase(),
    password,
    jwtSecret: new TextEncoder().encode(jwtSecretRaw.trim()),
  };
}

export function isSuperAdminConfigured(): boolean {
  return readConfig() !== null;
}

export function normalizeSuperAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Verifies credentials against environment variables only.
 * Never logs secrets. Returns a generic boolean.
 */
export function verifySuperAdminCredentials(email: string, password: string): boolean {
  const config = readConfig();
  if (!config) return false;

  const emailOk = timingSafeEqualUtf8(normalizeSuperAdminEmail(email), config.email);
  // Password must match env literally (no trim).
  const passwordOk = timingSafeEqualUtf8(password, config.password);
  return emailOk && passwordOk;
}

export async function createSuperAdminToken(email: string): Promise<string> {
  const config = readConfig();
  if (!config) {
    throw new Error("SUPER_ADMIN_NOT_CONFIGURED");
  }

  return new SignJWT({
    typ: "super_admin",
    email: normalizeSuperAdminEmail(email),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SUPER_ADMIN_SESSION_SECONDS}s`)
    .sign(config.jwtSecret);
}

export async function verifySuperAdminToken(token: string): Promise<SuperAdminSession | null> {
  const config = readConfig();
  if (!config) return null;

  try {
    const { payload } = await jwtVerify(token, config.jwtSecret);
    if (payload.typ !== "super_admin") return null;
    if (typeof payload.email !== "string" || !payload.email.trim()) return null;
    return { email: normalizeSuperAdminEmail(payload.email) };
  } catch {
    return null;
  }
}

export async function setSuperAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SUPER_ADMIN_SESSION_SECONDS,
  });
}

export async function clearSuperAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPER_ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySuperAdminToken(token);
}

/**
 * Returns the session or null. Callers decide redirect vs 401.
 * Does not consult the regular `session` cookie.
 */
export async function requireSuperAdmin(): Promise<SuperAdminSession | null> {
  return getSuperAdminSession();
}
