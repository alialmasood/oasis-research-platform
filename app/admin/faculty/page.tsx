import { getFacultyPageData } from "@/lib/admin/facultyRepo";
import { parseFacultyListFilters } from "@/lib/admin/facultyListUrl";
import { FacultyPageClient } from "./_components/FacultyPageClient";

export default async function AdminFacultyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFacultyListFilters(params);
  const data = await getFacultyPageData(filters);

  return <FacultyPageClient data={data} />;
}
