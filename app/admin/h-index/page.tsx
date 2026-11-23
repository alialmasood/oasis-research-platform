import { AdminPageHeader } from "../_components/AdminPageHeader";
import { FACULTY_BASE_WHERE } from "@/lib/admin/facultyRepo";
import { prisma } from "@/lib/db";
import { HIndexTable, type HIndexRow } from "./_components/HIndexTable";

export default async function AdminHIndexPage() {
  const researchers = await prisma.user.findMany({
    where: FACULTY_BASE_WHERE,
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      email: true,
      entity: true,
    },
    orderBy: [{ fullNameAr: "asc" }, { fullNameEn: "asc" }, { email: "asc" }],
  });

  const rows: HIndexRow[] = researchers.map((user) => ({
    id: user.id,
    name:
      user.fullNameAr?.trim() ||
      user.fullNameEn?.trim() ||
      user.email,
    entity: user.entity,
    // منطق الجلب يُضاف لاحقاً
    hIndex: null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="H-Index"
        description="سجل مؤشرات H-Index للتدريسيين والباحثين"
      />

      <HIndexTable rows={rows} />
    </div>
  );
}
