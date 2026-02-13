"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

// Schemas
const profileCvSchema = z.object({
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  nationality: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: "تاريخ الميلاد لا يجب أن يكون في المستقبل",
    })
    .transform((val) => (val ? new Date(val) : null)),
  province: z.string().optional(),
  district: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
});

const languageSchema = z.object({
  name: z.string().min(1, "اسم اللغة مطلوب"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"]),
});

const skillSchema = z.object({
  name: z.string().min(1, "اسم المهارة مطلوب"),
  level: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4", "LEVEL_5"]),
});

const experienceSchema = z
  .object({
    title: z.string().min(1, "العنوان الوظيفي مطلوب"),
    organization: z.string().min(1, "الجهة مطلوبة"),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().optional().transform((val) => (val ? new Date(val) : null)),
    description: z.string().optional(),
  })
  .refine(
    (data) => data.startDate <= new Date(),
    { message: "تاريخ البدء لا يجب أن يكون في المستقبل", path: ["startDate"] }
  )
  .refine(
    (data) => !data.endDate || data.endDate <= new Date(),
    { message: "تاريخ الانتهاء لا يجب أن يكون في المستقبل", path: ["endDate"] }
  );

// Create or Update Profile CV
export async function upsertProfileCv(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user || !user.roles.includes("RESEARCHER")) {
      return { error: "غير مصرح" };
    }

    const data = profileCvSchema.parse({
      gender: formData.get("gender") || undefined,
      nationality: formData.get("nationality") || undefined,
      dateOfBirth: formData.get("dateOfBirth") || undefined,
      province: formData.get("province") || undefined,
      district: formData.get("district") || undefined,
      area: formData.get("area") || undefined,
      address: formData.get("address") || undefined,
    });

    await prisma.profileCV.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        ...data,
      },
    });

    revalidatePath("/researcher/cv");
    revalidatePath("/researcher/cv/edit");
    return { success: true };
  } catch (error) {
    console.error("Error upserting profile CV:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "حدث خطأ أثناء حفظ البيانات" };
  }
}

// Add Language
export async function addLanguage(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user || !user.roles.includes("RESEARCHER")) {
      return { error: "غير مصرح" };
    }

    const data = languageSchema.parse({
      name: formData.get("name"),
      level: formData.get("level"),
    });

    // Get or create ProfileCV
    let profileCv = await prisma.profileCV.findUnique({
      where: { userId: user.id },
    });

    if (!profileCv) {
      profileCv = await prisma.profileCV.create({
        data: { userId: user.id },
      });
    }

    await prisma.language.create({
      data: {
        profileCvId: profileCv.id,
        ...data,
      },
    });

    revalidatePath("/researcher/cv");
    revalidatePath("/researcher/cv/edit");
    return { success: true };
  } catch (error) {
    console.error("Error adding language:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "حدث خطأ أثناء إضافة اللغة" };
  }
}

// Delete Language
export async function deleteLanguage(languageId: string) {
  try {
    const user = await getSessionUser();
    if (!user || !user.roles.includes("RESEARCHER")) {
      return { error: "غير مصرح" };
    }

    // Verify ownership
    const language = await prisma.language.findUnique({
      where: { id: languageId },
      include: { profileCv: true },
    });

    if (!language || language.profileCv.userId !== user.id) {
      return { error: "غير مصرح" };
    }

    await prisma.language.delete({
      where: { id: languageId },
    });

    revalidatePath("/researcher/cv");
    revalidatePath("/researcher/cv/edit");
    return { success: true };
  } catch (error) {
    console.error("Error deleting language:", error);
    return { error: "حدث خطأ أثناء حذف اللغة" };
  }
}

// Add Skill
export async function addSkill(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user || !user.roles.includes("RESEARCHER")) {
      return { error: "غير مصرح" };
    }

    const data = skillSchema.parse({
      name: formData.get("name"),
      level: formData.get("level"),
    });

    // Get or create ProfileCV
    let profileCv = await prisma.profileCV.findUnique({
      where: { userId: user.id },
    });

    if (!profileCv) {
      profileCv = await prisma.profileCV.create({
        data: { userId: user.id },
      });
    }

    await prisma.skill.create({
      data: {
        profileCvId: profileCv.id,
        ...data,
      },
    });

    revalidatePath("/researcher/cv");
    revalidatePath("/researcher/cv/edit");
    return { success: true };
  } catch (error) {
    console.error("Error adding skill:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "حدث خطأ أثناء إضافة المهارة" };
  }
}

// Delete Skill
export async function deleteSkill(skillId: string) {
  try {
    const user = await getSessionUser();
    if (!user || !user.roles.includes("RESEARCHER")) {
      return { error: "غير مصرح" };
    }

    // Verify ownership
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      include: { profileCv: true },
    });

    if (!skill || skill.profileCv.userId !== user.id) {
      return { error: "غير مصرح" };
    }

    await prisma.skill.delete({
      where: { id: skillId },
    });

    revalidatePath("/researcher/cv");
    revalidatePath("/researcher/cv/edit");
    return { success: true };
  } catch (error) {
    console.error("Error deleting skill:", error);
    return { error: "حدث خطأ أثناء حذف المهارة" };
  }
}

// Add Experience
export async function addExperience(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user || !user.roles.includes("RESEARCHER")) {
      return { error: "غير مصرح" };
    }

    const data = experienceSchema.parse({
      title: formData.get("title"),
      organization: formData.get("organization"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") || undefined,
      description: formData.get("description") || undefined,
    });

    // Get or create ProfileCV
    let profileCv = await prisma.profileCV.findUnique({
      where: { userId: user.id },
    });

    if (!profileCv) {
      profileCv = await prisma.profileCV.create({
        data: { userId: user.id },
      });
    }

    await prisma.experience.create({
      data: {
        profileCvId: profileCv.id,
        ...data,
      },
    });

    revalidatePath("/researcher/cv");
    revalidatePath("/researcher/cv/edit");
    return { success: true };
  } catch (error) {
    console.error("Error adding experience:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "حدث خطأ أثناء إضافة الخبرة" };
  }
}

// Delete Experience
export async function deleteExperience(experienceId: string) {
  try {
    const user = await getSessionUser();
    if (!user || !user.roles.includes("RESEARCHER")) {
      return { error: "غير مصرح" };
    }

    // Verify ownership
    const experience = await prisma.experience.findUnique({
      where: { id: experienceId },
      include: { profileCv: true },
    });

    if (!experience || experience.profileCv.userId !== user.id) {
      return { error: "غير مصرح" };
    }

    await prisma.experience.delete({
      where: { id: experienceId },
    });

    revalidatePath("/researcher/cv");
    revalidatePath("/researcher/cv/edit");
    return { success: true };
  } catch (error) {
    console.error("Error deleting experience:", error);
    return { error: "حدث خطأ أثناء حذف الخبرة" };
  }
}
