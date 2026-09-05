import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { resolvePublicUrl } from "@/lib/utils";
import { AdminLayoutClient } from "./_components/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("ADMIN")) {
    redirect("/login");
  }

  const profile = await prisma.researcherProfile.findUnique({
    where: { userId: user.id },
    select: { avatarUrl: true, avatarData: true },
  });

  const avatarUrl = profile?.avatarData
    ? `/api/avatar/${user.id}`
    : resolvePublicUrl(profile?.avatarUrl);

  return (
    <AdminLayoutClient user={{ fullName: user.fullName, avatarUrl }}>
      {children}
    </AdminLayoutClient>
  );
}
