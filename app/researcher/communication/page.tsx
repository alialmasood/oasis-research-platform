import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/middleware";
import {
  getDirectoryFilters,
  getDirectoryResearchers,
  listConversationsForUser,
} from "@/lib/communicationRepo";
import { CommunicationPageClient } from "./CommunicationPageClient";

type SearchParams = { conversation?: string };

export default async function ResearcherCommunicationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.roles.includes("RESEARCHER")) redirect("/login");

  const resolved = await searchParams;
  const [filters, directory, conversations] = await Promise.all([
    getDirectoryFilters(),
    getDirectoryResearchers({ currentUserId: user.id, page: 1 }),
    listConversationsForUser(user.id),
  ]);

  return (
    <Suspense fallback={<div className="text-sm text-slate-500">جاري التحميل...</div>}>
      <CommunicationPageClient
        currentUserId={user.id}
        initialFilters={filters}
        initialDirectory={directory}
        initialConversations={conversations}
        initialConversationId={resolved.conversation ?? null}
      />
    </Suspense>
  );
}
