import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { AcademicCvClient } from "./_components/AcademicCvClient";

export default async function AcademicCvPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  // Fetch academic degrees
  const academicDegrees = await prisma.academicDegree.findMany({
    where: { userId: user.id },
    orderBy: { graduationYear: "desc" },
  });

  return <AcademicCvClient initialDegrees={academicDegrees} />;
}
