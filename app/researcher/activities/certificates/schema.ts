import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const addCertificateSchema = z.object({
  title: z.string().min(2, "عنوان الشهادة مطلوب (حد أدنى حرفين)"),
  issuingOrganization: z.string().min(2, "الجهة المانحة مطلوبة (حد أدنى حرفين)"),
  date: z.coerce
    .date({ message: "التاريخ مطلوب" })
    .refine((d) => d <= todayEnd(), "التاريخ لا يمكن أن يكون في المستقبل"),
  description: z.string().optional().nullable(),
});

export type AddCertificateInput = z.infer<typeof addCertificateSchema>;

export const updateCertificateSchema = addCertificateSchema.extend({
  id: z.string().min(1, "معرف الشهادة مطلوب"),
});

export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;
