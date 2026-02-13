import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { CvClient } from "./_components/CvClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CvPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  // Fetch ProfileCV with related data
  // Note: Make sure to run `npx prisma generate` after adding new models
  let profileCv = null;
  
  // Check if profileCV model exists in Prisma Client
  if (!("profileCV" in prisma)) {
    console.warn(
      "[CV Page] Prisma Client doesn't have profileCV model. " +
      "Please run: npx prisma generate && npx prisma db push"
    );
    return <CvClient initialProfileCv={null} />;
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
    // If Prisma Client hasn't been generated yet, profileCV will be undefined
    console.error("Error fetching profile CV:", error);
    // Return null - the component will handle empty state
  }

  return <CvClient initialProfileCv={profileCv} />;
}
