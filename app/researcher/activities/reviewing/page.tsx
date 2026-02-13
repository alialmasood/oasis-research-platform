import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listResearcherReviewings } from "@/lib/researcherReviewingRepo";
import { ReviewingPageClient } from "./ReviewingPageClient";

export default async function ReviewingPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const reviewings = await listResearcherReviewings(session.id);

  return <ReviewingPageClient initialReviewings={reviewings} />;
}
