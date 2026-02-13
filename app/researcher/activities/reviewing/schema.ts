import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const reviewingTypeEnum = z.enum(["RESEARCHES", "SCIENTIFIC_ARTICLES", "THESES", "PATENTS", "SCIENTIFIC_CONSULTATIONS"], {
  message: "نوع التقويم مطلوب",
});

const statusEnum = z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"], {
  message: "حالة التقويم مطلوبة",
});

export const addReviewingSchema = z.object({
  title: z.string().min(2, "عنوان التقويم مطلوب (حد أدنى حرفين)"),
  type: reviewingTypeEnum,
  date: z.coerce
    .date({ message: "تاريخ التقويم مطلوب" })
    .refine((d) => d <= todayEnd(), "تاريخ التقويم لا يمكن أن يكون في المستقبل"),
  description: z.string().optional().nullable(),
  status: statusEnum,
});

export type AddReviewingInput = z.infer<typeof addReviewingSchema>;

export const updateReviewingSchema = addReviewingSchema.extend({
  id: z.string().min(1, "معرف التقويم مطلوب"),
});

export type UpdateReviewingInput = z.infer<typeof updateReviewingSchema>;
