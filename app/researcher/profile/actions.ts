"use server";

import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const CV_GENDER_LABELS: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  OTHER: "آخر",
};

export type ProfileData = {
  user: {
    id: string;
    fullNameAr: string | null;
    fullNameEn: string | null;
    email: string;
    phone: string | null;
    academicTitle: string | null;
    entity: string | null;
    department: string | null;
    generalSpecialization: string | null;
    specificSpecialization: string | null;
    employeeNumber: string | null;
    appointmentYear: number | null;
  };
  profile: {
    avatarUrl: string | null;
  };
  /** الجنس وتاريخ الميلاد من صفحة السيرة الذاتية (المعلومات الشخصية) — للعرض فقط */
  cvPersonal: {
    gender: string | null;
    dateOfBirth: Date | null;
  };
};

export async function getProfile(): Promise<ProfileData | null> {
  const session = await getSessionUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      email: true,
      phone: true,
      academicTitle: true,
      entity: true,
      department: true,
      generalSpecialization: true,
      specificSpecialization: true,
      employeeNumber: true,
      appointmentYear: true,
    },
  });

  if (!user) return null;

  let profile = await prisma.researcherProfile.findUnique({
    where: { userId: user.id },
    select: { avatarUrl: true },
  });

  if (!profile) {
    await prisma.researcherProfile.create({
      data: { userId: user.id },
    });
    profile = { avatarUrl: null };
  }

  const profileCv = await prisma.profileCV.findUnique({
    where: { userId: user.id },
    select: { gender: true, dateOfBirth: true },
  });

  const cvPersonal = {
    gender: profileCv?.gender
      ? (CV_GENDER_LABELS[profileCv.gender] ?? profileCv.gender)
      : null,
    dateOfBirth: profileCv?.dateOfBirth ?? null,
  };

  return {
    user: {
      id: user.id,
      fullNameAr: user.fullNameAr,
      fullNameEn: user.fullNameEn,
      email: user.email,
      phone: user.phone,
      academicTitle: user.academicTitle,
      entity: user.entity,
      department: user.department,
      generalSpecialization: user.generalSpecialization,
      specificSpecialization: user.specificSpecialization,
      employeeNumber: user.employeeNumber,
      appointmentYear: user.appointmentYear,
    },
    profile: { avatarUrl: profile.avatarUrl },
    cvPersonal,
  };
}

export async function uploadAvatar(formData: FormData): Promise<{ error?: string; url?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const file = formData.get("avatar") as File | null;
  if (!file || !(file instanceof File)) return { error: "لم يتم اختيار ملف" };

  if (!ALLOWED_TYPES.includes(file.type))
    return { error: "نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP" };
  if (file.size > MAX_SIZE) return { error: "حجم الصورة يجب أن لا يتجاوز 2 ميجابايت" };

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const filename = `${session.id}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "avatars");

  await mkdir(dir, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(dir, filename), buffer);

  const url = `/avatars/${filename}`;

  await prisma.researcherProfile.upsert({
    where: { userId: session.id },
    create: { userId: session.id, avatarUrl: url },
    update: { avatarUrl: url },
  });

  return { url };
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  await prisma.researcherProfile.updateMany({
    where: { userId: session.id },
    data: { avatarUrl: null },
  });

  return {};
}

export type AcademicAffiliationForm = {
  entity: string;
  department: string;
  generalSpecialization: string;
  specificSpecialization: string;
};

export async function updateAcademicAffiliation(
  data: AcademicAffiliationForm
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  // الجامعة لا تتغير — نحدّث القسم والكلية/التشكيل والتخصصات فقط
  await prisma.user.update({
    where: { id: session.id },
    data: {
      entity: data.entity || null,
      department: data.department && data.department !== "لا توجد أقسام" ? data.department : null,
      generalSpecialization: data.generalSpecialization || null,
      specificSpecialization: data.specificSpecialization || null,
    },
  });

  return {};
}

export type BasicInfoForm = {
  fullNameAr: string;
  fullNameEn: string;
  academicTitle: string;
  phone: string;
  employeeNumber: string;
  appointmentYear: string;
};

export async function updateBasicInfo(
  data: BasicInfoForm
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const appointmentYear = data.appointmentYear
    ? parseInt(data.appointmentYear, 10)
    : null;
  if (data.appointmentYear && (isNaN(appointmentYear!) || appointmentYear! < 1900 || appointmentYear! > 2100)) {
    return { error: "سنة التعيين غير صالحة" };
  }

  // الاسم (عربي/إنجليزي) والبريد والجنس وتاريخ الميلاد لا يُحدّثان — الجنس وتاريخ الميلاد من صفحة السيرة الذاتية
  await prisma.user.update({
    where: { id: session.id },
    data: {
      academicTitle: data.academicTitle || null,
      phone: data.phone || null,
      employeeNumber: data.employeeNumber || null,
      appointmentYear,
    },
  });

  return {};
}
