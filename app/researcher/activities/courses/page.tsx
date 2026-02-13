import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listCourses } from "./actions";
import { CoursesPageClient } from "./CoursesPageClient";

export default async function CoursesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listCourses();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <CoursesPageClient initialCourses={result.items} />;
}
