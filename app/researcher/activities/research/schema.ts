import { z } from "zod";

// Enums aligned with Prisma
export const researchTypeEnum = z.enum(["PLANNED", "UNPLANNED"]);
export const researchOwnershipEnum = z.enum(["INDIVIDUAL", "TEAM", "INSTITUTIONAL"]);
export const researchStatusEnum = z.enum(["IN_PROGRESS", "COMPLETED"]);
export const publishStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export const publishTypeEnum = z.enum(["JOURNAL", "CONFERENCE", "BOOK_CHAPTER", "REPORT", "OTHER"]);
export const scopusQuartileEnum = z.enum(["Q1", "Q2", "Q3", "Q4"]);

const categoriesSchema = z.array(z.string()).min(1, "يجب اختيار تصنيف واحد على الأقل");

const baseResearchSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  researchType: researchTypeEnum,
  ownership: researchOwnershipEnum,
  status: researchStatusEnum,
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
  year: z.number().int().min(1900).max(2100),
  categories: z.array(z.string()), // يمكن أن يكون فارغاً [] عندما لا يكون منشور
  scopusQuartile: scopusQuartileEnum.optional().nullable(),
});

// مخطط كامل بدون refinements — يُستخدم للتحديث مع .partial()
const fullResearchFieldsSchema = baseResearchSchema.extend({
  publishStatus: publishStatusEnum.optional().nullable(),
  researchUrl: z.string().url().optional().nullable().or(z.literal("")),
  publishType: publishTypeEnum.optional().nullable(),
  publisher: z.string().optional().nullable(),
  doi: z.string().optional().nullable().or(z.literal("")),
  publishMonth: z.number().int().min(1).max(12).optional().nullable(),
  downloadUrl: z.string().url().optional().nullable().or(z.literal("")),
});

// When status=COMPLETED => publishStatus is allowed
// When publishStatus=PUBLISHED => publishType, publisher required; publishMonth 1-12
// When publishStatus=PUBLISHED => categories required (min 1)
// When categories includes SCOPUS => scopusQuartile required (Q1..Q4)
export const createResearchSchema = fullResearchFieldsSchema.superRefine((data, ctx) => {
  if (data.status !== "COMPLETED") {
    if (data.publishStatus != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "publishStatus مسموح فقط عندما تكون الحالة منجز",
        path: ["publishStatus"],
      });
    }
    return;
  }
  if (data.publishStatus === "PUBLISHED") {
    if (!data.publishType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "نوع النشر مطلوب عند النشر", path: ["publishType"] });
    }
    if (!data.publisher?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "الناشر مطلوب عند النشر", path: ["publisher"] });
    }
    if (data.publishMonth != null && (data.publishMonth < 1 || data.publishMonth > 12)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "شهر النشر يجب أن يكون بين 1 و 12", path: ["publishMonth"] });
    }
    // التصنيفات مطلوبة فقط عند النشر
    if (!data.categories || data.categories.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب اختيار تصنيف واحد على الأقل عند النشر",
        path: ["categories"],
      });
    }
    // التحقق من scopusQuartile فقط عند النشر
    if (data.categories?.includes("SCOPUS") && !data.scopusQuartile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "تصنيف سكوبس (Q1–Q4) مطلوب عند تضمين SCOPUS",
        path: ["scopusQuartile"],
      });
    }
    if (data.categories?.includes("SCOPUS") && data.scopusQuartile) {
      const q = ["Q1", "Q2", "Q3", "Q4"];
      if (!q.includes(data.scopusQuartile)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "تصنيف سكوبس يجب أن يكون Q1 أو Q2 أو Q3 أو Q4",
          path: ["scopusQuartile"],
        });
      }
    }
  }
});

// لا نستخدم .partial() على schema يحتوي refinements — نستخدم المخطط الكامل بدون refinements
export const updateResearchSchema = fullResearchFieldsSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateResearchInput = z.infer<typeof createResearchSchema>;
export type UpdateResearchInput = z.infer<typeof updateResearchSchema>;

export type ResearchFilters = {
  status?: "IN_PROGRESS" | "COMPLETED";
  publishStatus?: "DRAFT" | "PUBLISHED";
  researchType?: string;
  year?: number;
  category?: string;
  publishType?: string;
  scopusQuartile?: string;
  search?: string;
};

export type ListResearchOptions = {
  researcherId: string;
  filters?: ResearchFilters;
  page?: number;
  pageSize?: number;
};
