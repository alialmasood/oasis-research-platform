import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SuperAdminAuditAction =
  | "ADMIN_CREATED"
  | "ADMIN_UPDATED"
  | "ADMIN_DISABLED"
  | "ADMIN_ENABLED"
  | "ADMIN_PASSWORD_RESET"
  | "USER_UPDATED"
  | "USER_DISABLED"
  | "USER_ENABLED"
  | "USER_SESSIONS_REVOKED";

export type SuperAdminAuditTargetType = "ADMIN" | "USER";

export type SafeAuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetEmail: string | null;
  actorEmail: string;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
};

type AuditClient = Prisma.TransactionClient | typeof prisma;

const FORBIDDEN_META_KEYS = new Set([
  "password",
  "passwordHash",
  "hash",
  "token",
  "jwt",
  "cookie",
  "secret",
  "SUPER_ADMIN_PASSWORD",
  "SUPER_ADMIN_JWT_SECRET",
  "NEXTAUTH_SECRET",
]);

export function sanitizeAuditMetadata(
  metadata?: Record<string, unknown> | null
): Prisma.InputJsonValue | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_META_KEYS.has(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      clean[key] = value;
      continue;
    }
    if (Array.isArray(value) && value.every((v) => typeof v === "string" || typeof v === "number")) {
      clean[key] = value;
      continue;
    }
    if (value === null) {
      clean[key] = null;
    }
  }
  return clean as Prisma.InputJsonValue;
}

export async function writeAuditLog(
  client: AuditClient,
  input: {
    action: SuperAdminAuditAction;
    targetType: SuperAdminAuditTargetType;
    targetId?: string | null;
    targetEmail?: string | null;
    actorEmail: string;
    metadata?: Record<string, unknown> | null;
  }
) {
  await client.superAdminAuditLog.create({
    data: {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      targetEmail: input.targetEmail ?? null,
      actorEmail: input.actorEmail.trim().toLowerCase(),
      metadata: sanitizeAuditMetadata(input.metadata) ?? Prisma.JsonNull,
    },
  });
}

const auditSelect = {
  id: true,
  action: true,
  targetType: true,
  targetId: true,
  targetEmail: true,
  actorEmail: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.SuperAdminAuditLogSelect;

function toSafeAudit(row: Prisma.SuperAdminAuditLogGetPayload<{ select: typeof auditSelect }>): SafeAuditLog {
  return {
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    targetEmail: row.targetEmail,
    actorEmail: row.actorEmail,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

export type AuditListQuery = {
  search?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export async function listAuditLogs(query: AuditListQuery = {}) {
  const page =
    Number.isFinite(query.page) && (query.page as number) > 0
      ? Math.floor(query.page as number)
      : 1;
  let pageSize =
    Number.isFinite(query.pageSize) && (query.pageSize as number) > 0
      ? Math.floor(query.pageSize as number)
      : 20;
  if (pageSize > 100) pageSize = 100;

  const and: Prisma.SuperAdminAuditLogWhereInput[] = [];
  const search = query.search?.trim();
  if (search) {
    and.push({
      OR: [
        { targetEmail: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
        { targetId: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (query.action && query.action !== "ALL") {
    and.push({ action: query.action });
  }
  if (query.targetType && query.targetType !== "ALL") {
    and.push({ targetType: query.targetType });
  }
  if (query.from) {
    const fromDate = new Date(query.from);
    if (!Number.isNaN(fromDate.getTime())) {
      and.push({ createdAt: { gte: fromDate } });
    }
  }
  if (query.to) {
    const toDate = new Date(query.to);
    if (!Number.isNaN(toDate.getTime())) {
      and.push({ createdAt: { lte: toDate } });
    }
  }

  const where: Prisma.SuperAdminAuditLogWhereInput =
    and.length > 0 ? { AND: and } : {};

  const [total, rows] = await Promise.all([
    prisma.superAdminAuditLog.count({ where }),
    prisma.superAdminAuditLog.findMany({
      where,
      select: auditSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toSafeAudit),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}
