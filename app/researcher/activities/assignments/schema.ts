import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const assignmentStatusEnum = z.enum(["COMPLETED", "IN_PROGRESS"]);

export const addAssignmentSchema = z
  .object({
    title: z.string().min(2, "موضوع التكليف مطلوب (حد أدنى حرفين)"),
    assignmentDate: z.coerce
      .date({ message: "تاريخ التكليف مطلوب" })
      .refine((d) => d <= todayEnd(), "تاريخ التكليف لا يمكن أن يكون في المستقبل"),
    status: assignmentStatusEnum,
    completionDate: z.coerce.date().optional().nullable(),
    description: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // إذا كان منتهي، يجب أن يكون هناك تاريخ انتهاء
      if (data.status === "COMPLETED") {
        return data.completionDate !== null && data.completionDate !== undefined;
      }
      // إذا كان غير منتهي، يجب أن يكون تاريخ الانتهاء null
      return data.completionDate === null || data.completionDate === undefined;
    },
    {
      message: "إذا كان التكليف منتهي، يجب إدخال تاريخ الانتهاء. وإذا كان غير منتهي، لا يجب إدخال تاريخ الانتهاء.",
      path: ["completionDate"],
    }
  )
  .refine(
    (data) => {
      // إذا كان هناك تاريخ انتهاء، يجب أن يكون في الماضي أو اليوم
      if (data.completionDate) {
        return data.completionDate <= todayEnd();
      }
      return true;
    },
    {
      message: "تاريخ الانتهاء لا يمكن أن يكون في المستقبل",
      path: ["completionDate"],
    }
  )
  .refine(
    (data) => {
      // تاريخ الانتهاء يجب أن يكون بعد تاريخ التكليف
      if (data.completionDate && data.assignmentDate) {
        return data.completionDate >= data.assignmentDate;
      }
      return true;
    },
    {
      message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ التكليف",
      path: ["completionDate"],
    }
  );

export type AddAssignmentInput = z.infer<typeof addAssignmentSchema>;

export const updateAssignmentSchema = addAssignmentSchema.extend({
  id: z.string().min(1, "معرف التكليف مطلوب"),
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
