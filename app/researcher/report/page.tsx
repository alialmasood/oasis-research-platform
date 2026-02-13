import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { getResearchSummaryStats } from "@/lib/research/researchDashboardStats";
import { getAcademicActivityStats } from "@/lib/researcherAcademicStats";
import { ReportClient } from "./ReportClient";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const fallbackYear = new Date().getFullYear();
  const yearParam = resolvedSearchParams.year ?? `${fallbackYear}`;
  const parsedYear = Number(yearParam);
  const yearNumber = Number.isNaN(parsedYear) ? fallbackYear : parsedYear;
  const year = `${yearNumber}`;
  const research = await getResearchSummaryStats(user.id, { year: yearNumber });
  const activities = await getAcademicActivityStats(user.id, { year: yearNumber });

  return (
    <ReportClient
      year={year}
      research={{
        total: research.total,
        published: research.published,
        scopus: research.scopus,
        thomson: research.thomson,
      }}
      activities={{
        conferences: activities.conferences,
        seminars: activities.seminars,
        workshops: activities.workshops,
        committees: activities.committees,
      }}
    />
  );
}
