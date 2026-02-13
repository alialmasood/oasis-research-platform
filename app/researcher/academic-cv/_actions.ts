"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

const currentYear = new Date().getFullYear();

const academicDegreeSchema = z.object({
  degree: z.enum(["BACHELORS", "DIPLOMA", "HIGHER_DIPLOMA", "MASTERS", "PHD", "BOARD"]),
  graduationYear: z
    .number()
    .int()
    .min(1950, "سنة التخرج يجب أن تكون 1950 أو أحدث")
    .max(currentYear + 1, `سنة التخرج يجب أن تكون ${currentYear + 1} أو أقدم`),
  majorGeneral: z.string().min(1, "التخصص العام مطلوب"),
  majorSpecific: z.string().optional(),
  university: z.string().min(1, "الجامعة مطلوبة"),
  country: z.string().min(1, "الدولة مطلوبة"),
});

export async function createAcademicDegree(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user) {
      redirect("/login");
    }

    const data = {
      degree: formData.get("degree") as string,
      graduationYear: parseInt(formData.get("graduationYear") as string),
      majorGeneral: formData.get("majorGeneral") as string,
      majorSpecific: formData.get("majorSpecific") as string || undefined,
      university: formData.get("university") as string,
      country: formData.get("country") as string,
    };

    const validatedData = academicDegreeSchema.parse(data);

    await prisma.academicDegree.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
    });

    revalidatePath("/researcher/academic-cv");
    return { success: true, message: "تم إضافة الشهادة العلمية بنجاح" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "بيانات غير صحيحة",
      };
    }
    console.error("Error creating academic degree:", error);
    return { success: false, message: "حدث خطأ أثناء إضافة الشهادة العلمية" };
  }
}

export async function updateAcademicDegree(id: string, formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user) {
      redirect("/login");
    }

    const data = {
      degree: formData.get("degree") as string,
      graduationYear: parseInt(formData.get("graduationYear") as string),
      majorGeneral: formData.get("majorGeneral") as string,
      majorSpecific: formData.get("majorSpecific") as string || undefined,
      university: formData.get("university") as string,
      country: formData.get("country") as string,
    };

    const validatedData = academicDegreeSchema.parse(data);

    // Verify ownership
    const existing = await prisma.academicDegree.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false, message: "الشهادة العلمية غير موجودة" };
    }

    await prisma.academicDegree.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath("/researcher/academic-cv");
    return { success: true, message: "تم تحديث الشهادة العلمية بنجاح" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "بيانات غير صحيحة",
      };
    }
    console.error("Error updating academic degree:", error);
    return { success: false, message: "حدث خطأ أثناء تحديث الشهادة العلمية" };
  }
}

export async function deleteAcademicDegree(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      redirect("/login");
    }

    // Verify ownership
    const existing = await prisma.academicDegree.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false, message: "الشهادة العلمية غير موجودة" };
    }

    await prisma.academicDegree.delete({
      where: { id },
    });

    revalidatePath("/researcher/academic-cv");
    return { success: true, message: "تم حذف الشهادة العلمية بنجاح" };
  } catch (error) {
    console.error("Error deleting academic degree:", error);
    return { success: false, message: "حدث خطأ أثناء حذف الشهادة العلمية" };
  }
}
