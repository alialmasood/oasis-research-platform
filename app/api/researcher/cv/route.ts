import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ profileCv: null }, { status: 401 });
  }

  try {
    const profileCv = await prisma.profileCV.findUnique({
      where: { userId: user.id },
      include: {
        languages: { orderBy: { createdAt: "desc" } },
        skills: { orderBy: { createdAt: "desc" } },
        experiences: { orderBy: { startDate: "desc" } },
      },
    });

    return NextResponse.json({ profileCv });
  } catch (error) {
    console.error("[CV API] Error fetching profile CV:", error);
    return NextResponse.json({ profileCv: null });
  }
}
