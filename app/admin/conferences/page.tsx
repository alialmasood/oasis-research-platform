import { AdminPageHeader } from "../_components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Presentation } from "lucide-react";

export default function AdminConferencesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="المؤتمرات"
        description="إدارة المؤتمرات والفعاليات العلمية"
      />

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB]/10">
            <Presentation className="h-7 w-7 text-[#2563EB]" />
          </div>
          <p className="text-slate-600 text-sm">سيتم بناء محتوى هذه الصفحة قريباً</p>
        </CardContent>
      </Card>
    </div>
  );
}
