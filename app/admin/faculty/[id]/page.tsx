import { notFound } from "next/navigation";
import { getFacultyMemberById } from "@/lib/admin/facultyRepo";
import { FacultyProfileClient } from "./_components/FacultyProfileClient";

export default async function AdminFacultyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getFacultyMemberById(id);

  if (!member) {
    notFound();
  }

  return <FacultyProfileClient member={member} />;
}
