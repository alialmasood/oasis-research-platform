import { z } from "zod";

const nameField = z
  .string()
  .trim()
  .min(1, "الاسم مطلوب")
  .max(80, "الاسم طويل جدًا");

const emailField = z
  .string()
  .trim()
  .email("البريد الإلكتروني غير صحيح")
  .transform((v) => v.toLowerCase());

const passwordField = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جدًا");

export const createAdminSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: emailField,
  password: passwordField,
});

export const updateAdminSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: emailField,
});

export const resetAdminPasswordSchema = z.object({
  password: passwordField,
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type ResetAdminPasswordInput = z.infer<typeof resetAdminPasswordSchema>;
