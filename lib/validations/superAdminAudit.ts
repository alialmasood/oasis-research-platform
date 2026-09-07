import { z } from "zod";

export const AUDIT_ACTIONS = [
  "ADMIN_CREATED",
  "ADMIN_UPDATED",
  "ADMIN_DISABLED",
  "ADMIN_ENABLED",
  "ADMIN_PASSWORD_RESET",
  "USER_UPDATED",
  "USER_DISABLED",
  "USER_ENABLED",
  "USER_SESSIONS_REVOKED",
] as const;

export const auditLogsQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  action: z
    .string()
    .trim()
    .optional()
    .default("ALL")
    .refine(
      (v) => v === "ALL" || (AUDIT_ACTIONS as readonly string[]).includes(v),
      "عملية غير صالحة"
    ),
  targetType: z
    .enum(["ALL", "ADMIN", "USER"])
    .optional()
    .default("ALL"),
  from: z.string().trim().optional().default(""),
  to: z.string().trim().optional().default(""),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const revokeSessionsParamsSchema = z.object({
  id: z.string().trim().min(1, "المعرّف مطلوب"),
});

export type AuditLogsQueryInput = z.infer<typeof auditLogsQuerySchema>;
