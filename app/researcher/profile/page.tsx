import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { getProfile } from "./actions";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getProfile();
  if (!data) redirect("/login");

  return <ProfileClient initialData={data} />;
}
