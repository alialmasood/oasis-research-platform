import { z } from "zod";

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const committeeRoleEnum = z.enum(["MEMBER", "CHAIRPERSON"]);

export const addCommitteeSchema = z.object({
  title: z.string().min(2, "عنوان اللجنة مطلوب (حد أدنى حرفين)"),
  assignmentDate: z.coerce
    .date({ message: "تاريخ التكليف مطلوب" })
    .refine((d) => d <= todayEnd(), "تاريخ التكليف لا يمكن أن يكون في المستقبل"),
  role: committeeRoleEnum,
  description: z.string().optional().nullable(),
});

export type AddCommitteeInput = z.infer<typeof addCommitteeSchema>;

export const updateCommitteeSchema = addCommitteeSchema.extend({
  id: z.string().min(1, "معرف اللجنة مطلوب"),
});

export type UpdateCommitteeInput = z.infer<typeof updateCommitteeSchema>;
