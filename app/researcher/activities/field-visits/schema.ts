import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const fieldVisitTypeEnum = z.enum(
  [
    "FIELD_VISIT_SUPERVISION",   // 12 نقطة
    "VOLUNTARY_INSIDE_MINISTRY", // 8 نقاط
    "SERVICE_OUTSIDE_MINISTRY",  // 6 نقاط
  ],
  { message: "نوع النشاط مطلوب" }
);

export const addFieldVisitSchema = z.object({
  type: fieldVisitTypeEnum,
  title: z.string().min(2, "عنوان النشاط مطلوب (حد أدنى حرفين)"),
  activityDate: z.coerce
    .date({ message: "تاريخ النشاط مطلوب" })
    .refine((d) => d <= todayEnd(), "تاريخ النشاط لا يمكن أن يكون في المستقبل"),
  description: z.string().optional().nullable(),
  documentationRef: z.string().optional().nullable(),
});

export type AddFieldVisitInput = z.infer<typeof addFieldVisitSchema>;

export const updateFieldVisitSchema = addFieldVisitSchema.extend({
  id: z.string().min(1, "معرف السجل مطلوب"),
});

export type UpdateFieldVisitInput = z.infer<typeof updateFieldVisitSchema>;
