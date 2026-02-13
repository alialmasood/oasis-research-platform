import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const participationTypeEnum = z.enum(["PRESENTER", "PARTICIPANT"]);

export const addCourseSchema = z.object({
  title: z.string().min(2, "عنوان الدورة مطلوب (حد أدنى حرفين)"),
  date: z.coerce
    .date({ message: "التاريخ مطلوب" })
    .refine((d) => d <= todayEnd(), "التاريخ لا يمكن أن يكون في المستقبل"),
  beneficiary: z.string().min(2, "الجهة المستفيدة مطلوبة (حد أدنى حرفين)"),
  location: z.string().min(2, "مكان انعقاد الدورة مطلوب (حد أدنى حرفين)"),
  participationType: participationTypeEnum,
  description: z.string().optional().nullable(),
});

export type AddCourseInput = z.infer<typeof addCourseSchema>;

export const updateCourseSchema = addCourseSchema.extend({
  id: z.string().min(1, "معرف الدورة مطلوب"),
});

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
