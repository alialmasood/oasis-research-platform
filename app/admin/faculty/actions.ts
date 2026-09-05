"use server";

import { getSessionUser } from "@/lib/middleware";
import { deleteFacultyMember } from "@/lib/admin/facultyRepo";
import { revalidatePath } from "next/cache";

export async function deleteFacultyMemberAction(
  targetId: string
): Promise<{ ok: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "غير مصرح" };
  if (!user.roles.includes("ADMIN")) return { error: "غير مصرح" };

  const result = await deleteFacultyMember(targetId, user.id);
  if ("ok" in result) {
    revalidatePath("/admin/faculty");
  }
  return result;
}
