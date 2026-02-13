import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listCertificates } from "./actions";
import { CertificatesPageClient } from "./CertificatesPageClient";

export default async function CertificatesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.roles.includes("RESEARCHER")) {
    redirect("/");
  }

  const result = await listCertificates();
  if ("error" in result) {
    return (
      <div className="p-6">
        <p className="text-red-600">خطأ: {result.error}</p>
      </div>
    );
  }

  return <CertificatesPageClient initialCertificates={result.items} />;
}
