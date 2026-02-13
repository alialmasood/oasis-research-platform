import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const roleEnum = z.enum(["EDITOR_IN_CHIEF", "ASSOCIATE_EDITOR", "EDITORIAL_BOARD", "REVIEWER"], {
  message: "الدور في المجلة مطلوب",
});

const typeEnum = z.enum(["LOCAL", "INTERNATIONAL", "ARABIC", "ENGLISH"], {
  message: "نوع المجلة مطلوب",
});

export const addJournalSchema = z
  .object({
    name: z.string().min(2, "اسم المجلة مطلوب (حد أدنى حرفين)"),
    role: roleEnum,
    type: typeEnum,
    startDate: z.coerce
      .date({ message: "تاريخ البداية مطلوب" })
      .refine((d) => d <= todayEnd(), "تاريخ البداية لا يمكن أن يكون في المستقبل"),
    isActive: z.boolean(),
    endDate: z.coerce
      .date({ message: "تاريخ النهاية مطلوب عند اختيار غير نشط" })
      .refine((d) => d <= todayEnd(), "تاريخ النهاية لا يمكن أن يكون في المستقبل")
      .nullable()
      .optional(),
    impactFactor: z.coerce.number().positive("معامل التأثير يجب أن يكون رقم موجب").nullable().optional(),
    description: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.isActive && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "تاريخ النهاية مطلوب عند اختيار غير نشط",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.endDate && data.startDate && data.endDate < data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
      path: ["endDate"],
    }
  );

export type AddJournalInput = z.infer<typeof addJournalSchema>;

export const updateJournalSchema = addJournalSchema.extend({
  id: z.string().min(1, "معرف المجلة مطلوب"),
});

export type UpdateJournalInput = z.infer<typeof updateJournalSchema>;
