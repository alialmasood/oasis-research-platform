import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { ResearcherLayoutClient } from "./_components/ResearcherLayoutClient";
import { getResearcherActivityCounts } from "@/lib/researcherActivityCounts";
import { prisma } from "@/lib/db";

export default async function ResearcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const activityCounts = await getResearcherActivityCounts(user.id);
  const profile = await prisma.researcherProfile.findUnique({
    where: { userId: user.id },
    select: { avatarUrl: true, avatarData: true },
  });

  const avatarUrl =
    profile?.avatarData != null ? `/api/avatar/${user.id}` : profile?.avatarUrl ?? null;

  return (
    <ResearcherLayoutClient
      user={{ ...user, avatarUrl }}
      activityCounts={activityCounts}
    >
      {children}
    </ResearcherLayoutClient>
  );
}
