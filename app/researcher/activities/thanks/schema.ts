import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const participationTypeEnum = z.enum(["PRESENTER", "PARTICIPANT"]);

export const addThankYouLetterSchema = z.object({
  issuingOrganization: z.string().min(2, "الجهة المانحة للشكر مطلوبة (حد أدنى حرفين)"),
  reason: z.string().min(2, "توجيه الشكر مطلوب (حد أدنى حرفين)"),
  date: z.coerce
    .date({ message: "التاريخ مطلوب" })
    .refine((d) => d <= todayEnd(), "التاريخ لا يمكن أن يكون في المستقبل"),
  participationType: participationTypeEnum.nullable().optional(),
  description: z.string().optional().nullable(),
});

export type AddThankYouLetterInput = z.infer<typeof addThankYouLetterSchema>;

export const updateThankYouLetterSchema = addThankYouLetterSchema.extend({
  id: z.string().min(1, "معرف كتاب الشكر مطلوب"),
});

export type UpdateThankYouLetterInput = z.infer<typeof updateThankYouLetterSchema>;
