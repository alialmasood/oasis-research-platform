import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const degreeTypeEnum = z.enum(["PHD", "MASTERS", "BACHELORS", "HIGHER_DIPLOMA"], {
  message: "نوع الدرجة مطلوب",
});

const statusEnum = z.enum(["COMPLETED", "IN_PROGRESS"], {
  message: "حالة المشروع مطلوبة",
});

const supervisionTypeEnum = z.enum(["SOLE", "JOINT"], {
  message: "نوع الإشراف مطلوب",
});

export const addSupervisionSchema = z
  .object({
    studentName: z.string().min(2, "اسم الطالب مطلوب (حد أدنى حرفين)"),
    degreeType: degreeTypeEnum,
    thesisTitle: z.string().min(2, "عنوان الرسالة/المشروع مطلوب (حد أدنى حرفين)"),
    startDate: z.coerce
      .date({ message: "تاريخ البداية مطلوب" })
      .refine((d) => d <= todayEnd(), "تاريخ البداية لا يمكن أن يكون في المستقبل"),
    endDate: z.coerce
      .date({ message: "تاريخ الانتهاء مطلوب عند اختيار مكتمل" })
      .refine((d) => d <= todayEnd(), "تاريخ الانتهاء لا يمكن أن يكون في المستقبل")
      .nullable()
      .optional(),
    status: statusEnum,
    supervisionType: supervisionTypeEnum.nullable().optional(),
    description: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // إذا كان المشروع مكتمل، يجب أن يكون تاريخ الانتهاء موجود
      if (data.status === "COMPLETED" && !data.endDate) {
        return false;
      }
      // إذا كان المشروع غير مكتمل، لا يجب أن يكون تاريخ الانتهاء موجود
      if (data.status === "IN_PROGRESS" && data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "تاريخ الانتهاء مطلوب عند اختيار مكتمل، وغير مسموح عند اختيار غير مكتمل",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // إذا كان تاريخ الانتهاء موجود، يجب أن يكون بعد تاريخ البداية
      if (data.endDate && data.startDate && data.endDate < data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // إذا كان نوع الدرجة دكتوراه أو ماجستير، يجب أن يكون نوع الإشراف موجود
      if ((data.degreeType === "PHD" || data.degreeType === "MASTERS") && !data.supervisionType) {
        return false;
      }
      // إذا كان نوع الدرجة بكالوريوس أو دبلوم عالي، لا يجب أن يكون نوع الإشراف موجود
      if ((data.degreeType === "BACHELORS" || data.degreeType === "HIGHER_DIPLOMA") && data.supervisionType) {
        return false;
      }
      return true;
    },
    {
      message: "نوع الإشراف مطلوب لدكتوراه وماجستير، وغير مسموح لبكالوريوس ودبلوم عالي",
      path: ["supervisionType"],
    }
  );

export type AddSupervisionInput = z.infer<typeof addSupervisionSchema>;

export const updateSupervisionSchema = addSupervisionSchema.extend({
  id: z.string().min(1, "معرف الإشراف مطلوب"),
});

export type UpdateSupervisionInput = z.infer<typeof updateSupervisionSchema>;
