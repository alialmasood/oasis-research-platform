import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { CvEditClient } from "./_components/CvEditClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CvEditPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  // Fetch ProfileCV with related data
  let profileCv = null;
  
  // Check if profileCV model exists in Prisma Client
  if (!("profileCV" in prisma)) {
    console.warn(
      "[CV Edit Page] Prisma Client doesn't have profileCV model. " +
      "Please run: npx prisma generate && npx prisma db push"
    );
    return <CvEditClient initialProfileCv={null} />;
  }

  try {
    profileCv = await (prisma.profileCV as any).findUnique({
      where: { userId: user.id },
      include: {
        languages: {
          orderBy: { createdAt: "desc" },
        },
        skills: {
          orderBy: { createdAt: "desc" },
        },
        experiences: {
          orderBy: { startDate: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching profile CV:", error);
  }

  return <CvEditClient initialProfileCv={profileCv} />;
}
