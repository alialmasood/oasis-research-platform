import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const volunteeringTypeEnum = z.enum([
  "HELPING_POOR_NEEDY",
  "ENVIRONMENTAL_PROTECTION",
  "EMERGENCY_SUPPORT",
  "CULTURAL_EDUCATIONAL_ACTIVITIES",
  "HELPING_ELDERLY",
  "SPORTS_ACTIVITIES",
  "SOCIAL_ACTIVITIES",
  "HOSPITALS_ORPHANAGES",
  "EDUCATION_FIELD",
  "COMMUNITY_DEVELOPMENT",
  "HUMAN_RIGHTS",
  "ARTS_CULTURE",
  "TECHNOLOGY_COMMUNICATIONS",
  "LAW_FIELD",
  "HEALTH_FIELD",
  "FIRST_AID",
  "ANIMAL_WELFARE",
], {
  message: "نوع العمل مطلوب",
});

const roleEnum = z.enum(["COORDINATOR", "LEADER", "PARTICIPANT", "MEMBER", "VOLUNTEER"], {
  message: "الدور مطلوب",
});

const durationUnitEnum = z.enum(["YEAR", "MONTH", "DAY"], {
  message: "وحدة المدة مطلوبة",
});

export const addVolunteeringSchema = z
  .object({
    title: z.string().min(2, "عنوان العمل الطوعي مطلوب (حد أدنى حرفين)"),
    type: volunteeringTypeEnum,
    role: roleEnum,
    organizationName: z.string().min(2, "اسم الجهة المنظمة مطلوب (حد أدنى حرفين)"),
    startDate: z.coerce
      .date({ message: "تاريخ البداية مطلوب" })
      .refine((d) => d <= todayEnd(), "تاريخ البداية لا يمكن أن يكون في المستقبل"),
    endDate: z.coerce
      .date({ message: "تاريخ النهاية مطلوب عند اختيار غير مستمر" })
      .refine((d) => d <= todayEnd(), "تاريخ النهاية لا يمكن أن يكون في المستقبل")
      .nullable()
      .optional(),
    isOngoing: z.boolean(),
    durationYears: z.coerce.number().int().min(0, "عدد السنوات يجب أن يكون 0 أو أكبر"),
    durationMonths: z.coerce.number().int().min(0, "عدد الأشهر يجب أن يكون 0 أو أكبر"),
    durationDays: z.coerce.number().int().min(0, "عدد الأيام يجب أن يكون 0 أو أكبر"),
    durationUnit: durationUnitEnum,
    location: z.string().optional().nullable(),
    beneficiaries: z.string().optional().nullable(),
    certificates: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // إذا كان العمل غير مستمر، يجب أن يكون تاريخ النهاية موجود
      if (!data.isOngoing && !data.endDate) {
        return false;
      }
      // إذا كان العمل مستمر، لا يجب أن يكون تاريخ النهاية موجود
      if (data.isOngoing && data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "تاريخ النهاية مطلوب عند اختيار غير مستمر، وغير مسموح عند اختيار مستمر",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // إذا كان تاريخ النهاية موجود، يجب أن يكون بعد تاريخ البداية
      if (data.endDate && data.startDate && data.endDate < data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // يجب أن يكون هناك مدة واحدة على الأقل (سنة أو شهر أو يوم) فقط إذا كان العمل غير مستمر
      if (!data.isOngoing && data.durationYears === 0 && data.durationMonths === 0 && data.durationDays === 0) {
        return false;
      }
      return true;
    },
    {
      message: "يجب تحديد المدة (سنة أو شهر أو يوم) عند اختيار غير مستمر",
      path: ["durationYears"],
    }
  );

export type AddVolunteeringInput = z.infer<typeof addVolunteeringSchema>;

export const updateVolunteeringSchema = addVolunteeringSchema.extend({
  id: z.string().min(1, "معرف العمل الطوعي مطلوب"),
});

export type UpdateVolunteeringInput = z.infer<typeof updateVolunteeringSchema>;
