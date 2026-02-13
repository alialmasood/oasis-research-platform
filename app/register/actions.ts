"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Schema للتحقق من بيانات التسجيل
const registerSchema = z.object({
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .refine((email) => email.endsWith("@uobasrah.edu.iq"), {
      message: "يجب أن يكون البريد من نطاق @uobasrah.edu.iq",
    }),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string(),
  fullNameAr: z.string().min(1, "الاسم بالعربية مطلوب"),
  fullNameEn: z.string().min(1, "الاسم بالإنجليزية مطلوب"),
  phone: z
    .string()
    .regex(/^\+964[0-9]{9,10}$/, "يجب أن يبدأ الرقم بـ +964 ويتبعه 9-10 أرقام"),
  academicTitle: z.string().min(1, "اللقب العلمي مطلوب"),
  entity: z.string().min(1, "الكلية/التشكيل مطلوب"),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export async function register(formData: FormData) {
  try {
    // استخراج البيانات من FormData
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      fullNameAr: formData.get("fullNameAr") as string,
      fullNameEn: formData.get("fullNameEn") as string,
      phone: formData.get("phone") as string,
      academicTitle: formData.get("academicTitle") as string,
      entity: formData.get("entity") as string,
      department: formData.get("department") as string | null,
    };

    // التحقق من صحة البيانات
    const validatedData = registerSchema.parse(rawData);

    // التحقق من عدم وجود email مكرر
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        error: "البريد الإلكتروني مستخدم بالفعل",
        field: "email",
      };
    }

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // إنشاء المستخدم الجديد
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        fullNameAr: validatedData.fullNameAr,
        fullNameEn: validatedData.fullNameEn,
        phone: validatedData.phone,
        academicTitle: validatedData.academicTitle,
        entity: validatedData.entity,
        department: validatedData.department || null,
        role: "RESEARCHER",
        isActive: true,
      },
    });

    // البحث عن دور RESEARCHER أو إنشائه إذا لم يكن موجوداً
    let researcherRole = await prisma.role.findUnique({
      where: { name: "RESEARCHER" },
    });

    if (!researcherRole) {
      researcherRole = await prisma.role.create({
        data: {
          name: "RESEARCHER",
          description: "باحث",
        },
      });
    }

    // إضافة دور RESEARCHER للمستخدم الجديد
    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        roleId: researcherRole.id,
      },
    });

    // إرجاع success بدلاً من redirect مباشرة
    console.log("[Server Action] User created successfully:", newUser.id);
    return {
      success: true,
      message: "تم إنشاء الحساب بنجاح",
    };
  } catch (error) {
    // معالجة أخطاء Zod
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        error: firstError.message,
        field: firstError.path[0] as string,
      };
    }

    // معالجة أخطاء قاعدة البيانات
    if (error instanceof Error) {
      // التحقق من أخطاء Prisma المحددة
      if (error.message.includes("Unique constraint")) {
        return {
          error: "البريد الإلكتروني مستخدم بالفعل",
          field: "email",
        };
      }
      return {
        error: error.message || "حدث خطأ أثناء التسجيل",
      };
    }

    return {
      error: "حدث خطأ غير متوقع أثناء التسجيل",
    };
  }
}
