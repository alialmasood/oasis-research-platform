import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listThankYouLetters } from "./actions";
import { ThanksPageClient } from "./ThanksPageClient";

export default async function ThanksPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listThankYouLetters();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <ThanksPageClient initialThankYouLetters={result.items} />;
}
