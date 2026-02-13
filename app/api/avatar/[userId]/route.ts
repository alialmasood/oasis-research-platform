import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * يعيد بيانات الصورة الشخصية من قاعدة البيانات
 * GET /api/avatar/[userId]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
  }

  const profile = await prisma.researcherProfile.findUnique({
    where: { userId },
    select: { avatarData: true, avatarMimeType: true },
  });

  if (!profile?.avatarData) {
    return new NextResponse(null, { status: 404 });
  }

  const mimeType = profile.avatarMimeType ?? "image/jpeg";
  const buffer = Buffer.from(profile.avatarData);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=86400", // تخزين مؤقت ليوم واحد
    },
  });
}
