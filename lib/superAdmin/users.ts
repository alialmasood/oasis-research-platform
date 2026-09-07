import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/superAdmin/audit";

export type SafePlatformUser = {
  id: string;
  email: string;
  fullNameAr: string | null;
  fullNameEn: string | null;
  phone: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export type UsersListQuery = {
  search?: string;
  role?: string;
  status?: "ALL" | "ACTIVE" | "DISABLED";
  page?: number;
  pageSize?: number;
};

export type UsersListResult = {
  items: SafePlatformUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export class UserServiceError extends Error {
  constructor(
    public code: "EMAIL_EXISTS" | "NOT_FOUND" | "INTERNAL",
    message?: string
  ) {
    super(message ?? code);
    this.name = "UserServiceError";
  }
}

const userSelect = {
  id: true,
  email: true,
  fullNameAr: true,
  fullNameEn: true,
  phone: true,
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

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function toSafeUser(row: UserRow): SafePlatformUser {
  return {
    id: row.id,
    email: row.email,
    fullNameAr: row.fullNameAr,
    fullNameEn: row.fullNameEn,
    phone: row.phone,
    isActive: row.isActive,
    roles: row.userRoles.map((ur) => ur.role.name),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildUsersWhere(query: UsersListQuery): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];
  const search = query.search?.trim();
  if (search) {
    and.push({
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { fullNameAr: { contains: search, mode: "insensitive" } },
        { fullNameEn: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const role = query.role?.trim();
  if (role && role !== "ALL") {
    and.push({
      userRoles: {
        some: {
          role: { name: role },
        },
      },
    });
  }

  if (query.status === "ACTIVE") {
    and.push({ isActive: true });
  } else if (query.status === "DISABLED") {
    and.push({ isActive: false });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function normalizeUsersPagination(input: {
  page?: number;
  pageSize?: number;
}): { page: number; pageSize: number } {
  const page = Number.isFinite(input.page) && (input.page as number) > 0 ? Math.floor(input.page as number) : 1;
  let pageSize =
    Number.isFinite(input.pageSize) && (input.pageSize as number) > 0
      ? Math.floor(input.pageSize as number)
      : 20;
  if (pageSize > 100) pageSize = 100;
  return { page, pageSize };
}

export async function listUsers(query: UsersListQuery = {}): Promise<UsersListResult> {
  const { page, pageSize } = normalizeUsersPagination({
    page: query.page,
    pageSize: query.pageSize,
  });
  const where = buildUsersWhere(query);
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return {
    items: rows.map(toSafeUser),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

export async function getUserById(id: string): Promise<SafePlatformUser | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
  return row ? toSafeUser(row) : null;
}

export async function updateUser(
  id: string,
  input: {
    fullNameAr: string;
    fullNameEn: string;
    email: string;
    phone?: string | null;
  },
  actorEmail: string
): Promise<SafePlatformUser> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullNameAr: true,
      fullNameEn: true,
      phone: true,
    },
  });
  if (!existing) throw new UserServiceError("NOT_FOUND");

  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() ? input.phone.trim() : null;
  const fullNameAr = input.fullNameAr.trim();
  const fullNameEn = input.fullNameEn.trim();

  const changedFields: string[] = [];
  if (email !== existing.email) changedFields.push("email");
  if (fullNameAr !== (existing.fullNameAr ?? "")) changedFields.push("fullNameAr");
  if (fullNameEn !== (existing.fullNameEn ?? "")) changedFields.push("fullNameEn");
  if (phone !== (existing.phone ?? null)) changedFields.push("phone");

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.user.update({
        where: { id },
        data: {
          email,
          fullNameAr,
          fullNameEn,
          phone,
        },
        select: userSelect,
      });

      await writeAuditLog(tx, {
        action: "USER_UPDATED",
        targetType: "USER",
        targetId: row.id,
        targetEmail: row.email,
        actorEmail,
        metadata: { changedFields },
      });

      return row;
    });
    return toSafeUser(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new UserServiceError("EMAIL_EXISTS");
    }
    throw new UserServiceError("INTERNAL");
  }
}

export async function setUserActiveState(
  id: string,
  isActive: boolean,
  actorEmail: string
): Promise<SafePlatformUser> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, isActive: true },
  });
  if (!existing) throw new UserServiceError("NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.user.update({
      where: { id },
      data: { isActive },
      select: userSelect,
    });

    await writeAuditLog(tx, {
      action: isActive ? "USER_ENABLED" : "USER_DISABLED",
      targetType: "USER",
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

  return toSafeUser(updated);
}

export async function revokeUserSessions(
  id: string,
  actorEmail: string
): Promise<SafePlatformUser> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  if (!existing) throw new UserServiceError("NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.user.update({
      where: { id },
      data: { sessionVersion: { increment: 1 } },
      select: userSelect,
    });

    await writeAuditLog(tx, {
      action: "USER_SESSIONS_REVOKED",
      targetType: "USER",
      targetId: row.id,
      targetEmail: row.email,
      actorEmail,
      metadata: { reason: "super_admin_revoke_sessions" },
    });

    return row;
  });

  return toSafeUser(updated);
}

export async function listRoleNames(): Promise<string[]> {
  const roles = await prisma.role.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return roles.map((r) => r.name);
}

export async function getPlatformStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  totalAdmins: number;
  totalResearchers: number;
}> {
  const adminWhere: Prisma.UserWhereInput = {
    userRoles: { some: { role: { name: "ADMIN" } } },
  };
  const researcherWhere: Prisma.UserWhereInput = {
    userRoles: { some: { role: { name: "RESEARCHER" } } },
  };

  const [totalUsers, activeUsers, totalAdmins, totalResearchers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: adminWhere }),
    prisma.user.count({ where: researcherWhere }),
  ]);

  return {
    totalUsers,
    activeUsers,
    disabledUsers: totalUsers - activeUsers,
    totalAdmins,
    totalResearchers,
  };
}
