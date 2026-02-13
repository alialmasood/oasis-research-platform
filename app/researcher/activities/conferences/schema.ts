import { z } from "zod";

export const scopeEnum = z.enum(["GLOBAL", "LOCAL"]);
export const participationTypeEnum = z.enum(["ATTENDEE", "RESEARCHER"]);

const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const addConferenceSchema = z.object({
  title: z.string().min(1, "عنوان المؤتمر مطلوب"),
  sponsor: z.string().min(1, "الجهة الراعية مطلوبة"),
  date: z.coerce
    .date({ message: "التاريخ مطلوب" })
    .refine((d) => d <= todayEnd(), "التاريخ لا يمكن أن يكون في المستقبل"),
  location: z.string().min(1, "مكان الانعقاد مطلوب"),
  scope: scopeEnum,
  isCommitteeMember: z.boolean(),
  participationType: participationTypeEnum,
});

export type AddConferenceInput = z.infer<typeof addConferenceSchema>;

export const updateConferenceSchema = addConferenceSchema.extend({
  id: z.string().min(1, "معرف المؤتمر مطلوب"),
});
export type UpdateConferenceInput = z.infer<typeof updateConferenceSchema>;
