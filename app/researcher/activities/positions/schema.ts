import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const addPositionSchema = z
  .object({
    title: z.string().min(2, "عنوان المنصب مطلوب (حد أدنى حرفين)"),
    positionDate: z.coerce
      .date({ message: "تاريخ المنصب مطلوب" })
      .refine((d) => d <= todayEnd(), "التاريخ لا يمكن أن يكون في المستقبل"),
    durationYears: z.coerce.number().int().min(0, "عدد السنوات يجب أن يكون 0 أو أكثر"),
    durationMonths: z.coerce.number().int().min(0).max(11, "عدد الأشهر يجب أن يكون بين 0 و 11"),
    durationDays: z.coerce.number().int().min(0).max(31, "عدد الأيام يجب أن يكون بين 0 و 31"),
    organization: z.string().min(2, "اسم الجهة مطلوب (حد أدنى حرفين)"),
    description: z.string().optional().nullable(),
  })
  .refine(
    (data) => data.durationYears > 0 || data.durationMonths > 0 || data.durationDays > 0,
    {
      message: "يجب أن تكون مدة المنصب أكبر من صفر (سنة أو شهر أو يوم على الأقل)",
      path: ["durationYears"], // يظهر الخطأ على حقل durationYears
    }
  );

export type AddPositionInput = z.infer<typeof addPositionSchema>;

export const updatePositionSchema = addPositionSchema.extend({
  id: z.string().min(1, "معرف المنصب مطلوب"),
});

export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
