import { z } from "zod";

export const superAdminLoginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export type SuperAdminLoginInput = z.infer<typeof superAdminLoginSchema>;
