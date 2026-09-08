import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/superAdmin/audit";

export type SafeAdmin = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
};

export class AdminServiceError extends Error {
  constructor(
    public code:
      | "EMAIL_EXISTS"
      | "NOT_FOUND"
      | "ADMIN_ROLE_MISSING"
      | "INTERNAL",
    message?: string
  ) {
    super(message ?? code);
    this.name = "AdminServiceError";
  }
}

const adminSelect = {
  id: true,
  email: true,
  fullNameAr: true,
  fullNameEn: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: {
      role: {
        select: { name: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

type AdminRow = Prisma.UserGetPayload<{ select: typeof adminSelect }>;

const adminWhere: Prisma.UserWhereInput = {
  userRoles: {
    some: {
      role: { name: "ADMIN" },
    },
  },
};

function splitName(full: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function toSafeAdmin(row: AdminRow): SafeAdmin {
  const source = row.fullNameAr?.trim() || row.fullNameEn?.trim() || "";
  const { firstName, lastName } = splitName(source);
  return {
    id: row.id,
    firstName,
    lastName,
    email: row.email,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    roles: row.userRoles.map((ur) => ur.role.name),
  };
}

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function listAdmins(): Promise<SafeAdmin[]> {
  const rows = await prisma.user.findMany({
    where: adminWhere,
    select: adminSelect,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toSafeAdmin);
}

export async function getAdminStats(): Promise<{
  total: number;
  active: number;
  disabled: number;
}> {
  const [total, active] = await Promise.all([
    prisma.user.count({ where: adminWhere }),
    prisma.user.count({ where: { ...adminWhere, isActive: true } }),
  ]);
  return {
    total,
    active,
    disabled: total - active,
  };
}

export async function getAdminById(id: string): Promise<SafeAdmin | null> {
  const row = await prisma.user.findFirst({
    where: { id, ...adminWhere },
    select: adminSelect,
  });
  return row ? toSafeAdmin(row) : null;
}

async function assertIsAdmin(id: string): Promise<AdminRow> {
  const row = await prisma.user.findFirst({
    where: { id, ...adminWhere },
    select: adminSelect,
  });
  if (!row) throw new AdminServiceError("NOT_FOUND");
  return row;
}

export async function createAdmin(
  input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  },
  actorEmail: string
): Promise<SafeAdmin> {
  const email = input.email.trim().toLowerCase();
  const fullName = joinName(input.firstName, input.lastName);
  const passwordHash = await hashAdminPassword(input.password);

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Production DBs may have schema without seed; ensure ADMIN role exists.
      const adminRole = await tx.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: {
          name: "ADMIN",
          description: "مدير النظام",
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullNameAr: fullName,
          fullNameEn: fullName,
          role: "ADMIN",
          isActive: true,
        },
        select: adminSelect,
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      await writeAuditLog(tx, {
        action: "ADMIN_CREATED",
        targetType: "ADMIN",
        targetId: user.id,
        targetEmail: user.email,
        actorEmail,
        metadata: { changedFields: ["email", "fullNameAr", "fullNameEn", "role"] },
      });

      const withRole = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: adminSelect,
      });

      return withRole;
    });

    return toSafeAdmin(created);
  } catch (error) {
    if (error instanceof AdminServiceError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AdminServiceError("EMAIL_EXISTS");
    }
    throw new AdminServiceError("INTERNAL");
  }
}

export async function updateAdmin(
  id: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
  },
  actorEmail: string
): Promise<SafeAdmin> {
  const existing = await assertIsAdmin(id);
  const email = input.email.trim().toLowerCase();
  const fullName = joinName(input.firstName, input.lastName);
  const changedFields: string[] = [];
  if (email !== existing.email) changedFields.push("email");
  const prevName = existing.fullNameAr?.trim() || existing.fullNameEn?.trim() || "";
  if (fullName !== prevName) {
    changedFields.push("fullNameAr", "fullNameEn");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.user.update({
        where: { id },
        data: {
          email,
          fullNameAr: fullName,
          fullNameEn: fullName,
        },
        select: adminSelect,
      });

      await writeAuditLog(tx, {
        action: "ADMIN_UPDATED",
        targetType: "ADMIN",
        targetId: row.id,
        targetEmail: row.email,
        actorEmail,
        metadata: { changedFields },
      });

      return row;
    });
    return toSafeAdmin(updated);
  } catch (error) {
    if (error instanceof AdminServiceError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AdminServiceError("EMAIL_EXISTS");
    }
    throw new AdminServiceError("INTERNAL");
  }
}

export async function setAdminActiveState(
  id: string,
  isActive: boolean,
  actorEmail: string
): Promise<SafeAdmin> {
  const existing = await assertIsAdmin(id);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.user.update({
      where: { id },
      data: { isActive },
      select: adminSelect,
    });

    await writeAuditLog(tx, {
      action: isActive ? "ADMIN_ENABLED" : "ADMIN_DISABLED",
      targetType: "ADMIN",
      targetId: row.id,
      targetEmail: row.email,
      actorEmail,
      metadata: {
        previousIsActive: existing.isActive,
        newIsActive: isActive,
      },
    });

    return row;
  });

  return toSafeAdmin(updated);
}

export async function resetAdminPassword(
  id: string,
  password: string,
  actorEmail: string
): Promise<void> {
  const existing = await assertIsAdmin(id);
  const passwordHash = await hashAdminPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
      select: { id: true },
    });

    await writeAuditLog(tx, {
      action: "ADMIN_PASSWORD_RESET",
      targetType: "ADMIN",
      targetId: existing.id,
      targetEmail: existing.email,
      actorEmail,
      metadata: { sessionInvalidated: true },
    });
  });
}

export async function revokeAdminSessions(
  id: string,
  actorEmail: string
): Promise<SafeAdmin> {
  await assertIsAdmin(id);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.user.update({
      where: { id },
      data: { sessionVersion: { increment: 1 } },
      select: adminSelect,
    });

    await writeAuditLog(tx, {
      action: "USER_SESSIONS_REVOKED",
      targetType: "ADMIN",
      targetId: row.id,
      targetEmail: row.email,
      actorEmail,
      metadata: { reason: "super_admin_revoke_sessions" },
    });

    return row;
  });

  return toSafeAdmin(updated);
}
