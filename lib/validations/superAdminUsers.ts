import { z } from "zod";

const optionalPhone = z
  .string()
  .trim()
  .max(30, "رقم الهاتف طويل جدًا")
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

export const updatePlatformUserSchema = z.object({
  fullNameAr: z.string().trim().min(1, "الاسم بالعربية مطلوب").max(120),
  fullNameEn: z.string().trim().min(1, "الاسم بالإنجليزية مطلوب").max(120),
  email: z
    .string()
    .trim()
    .email("البريد الإلكتروني غير صحيح")
    .transform((v) => v.toLowerCase()),
  phone: optionalPhone,
});

export const usersListQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  role: z.string().trim().optional().default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "DISABLED"]).optional().default("ALL"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type UpdatePlatformUserInput = z.infer<typeof updatePlatformUserSchema>;
export type UsersListQueryInput = z.infer<typeof usersListQuerySchema>;
