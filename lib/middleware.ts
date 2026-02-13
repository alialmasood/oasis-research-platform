import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "./auth";

export async function getSessionUser(): Promise<{
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  return await verifySession(token);
}

export function requireAuth(
  handler: (request: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return handler(request, user);
  };
}

export function requireRole(
  allowedRoles: string[],
  handler: (request: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return handler(request, user);
  };
}

export function requirePermission(
  requiredPermission: string,
  handler: (request: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!user.permissions.includes(requiredPermission)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return handler(request, user);
  };
}
