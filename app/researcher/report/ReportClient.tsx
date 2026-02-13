"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type ReportClientProps = {
  year: string;
  research: {
    total: number;
    published: number;
    scopus: number;
    thomson: number;
  };
  activities: {
    conferences: number;
    seminars: number;
    workshops: number;
    committees: number;
  };
};

export function ReportClient({ year, research, activities }: ReportClientProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-6 print:pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تقرير الأداء السنوي</h1>
          <p className="text-lg text-gray-600">جامعة البصرة - منصة واحة الباحث</p>
          <p className="text-sm text-gray-500 mt-2">سنة {year}</p>
        </div>

        {/* Research Stats */}
        <Card className="border border-gray-200 shadow-sm print:shadow-none">
          <CardHeader className="bg-gray-50 print:bg-white">
            <CardTitle className="text-xl font-semibold text-gray-900">ملخص البحوث</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{research.total}</div>
                <div className="text-sm text-gray-600 mt-1">إجمالي البحوث</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{research.published}</div>
                <div className="text-sm text-gray-600 mt-1">بحوث منشورة</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{research.scopus}</div>
                <div className="text-sm text-gray-600 mt-1">Scopus</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{research.thomson}</div>
                <div className="text-sm text-gray-600 mt-1">Thomson Reuters</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Activities */}
        <Card className="border border-gray-200 shadow-sm print:shadow-none">
          <CardHeader className="bg-gray-50 print:bg-white">
            <CardTitle className="text-xl font-semibold text-gray-900">النشاطات الأكاديمية</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3">
                <div className="text-xl font-bold text-gray-900">{activities.conferences}</div>
                <div className="text-xs text-gray-600 mt-1">مؤتمرات</div>
              </div>
              <div className="text-center p-3">
                <div className="text-xl font-bold text-gray-900">{activities.seminars}</div>
                <div className="text-xs text-gray-600 mt-1">ندوات</div>
              </div>
              <div className="text-center p-3">
                <div className="text-xl font-bold text-gray-900">{activities.workshops}</div>
                <div className="text-xs text-gray-600 mt-1">ورش عمل</div>
              </div>
              <div className="text-center p-3">
                <div className="text-xl font-bold text-gray-900">{activities.committees}</div>
                <div className="text-xs text-gray-600 mt-1">لجان</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
          <p>تم إنشاء هذا التقرير تلقائياً من منصة واحة الباحث</p>
          <p className="mt-1">تاريخ الإنشاء: {new Date().toLocaleDateString("ar-IQ")}</p>
        </div>

        {/* Print Button (hidden in print) */}
        <div className="flex justify-center print:hidden">
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="h-4 w-4 ml-2" />
            طباعة التقرير
          </Button>
        </div>
      </div>
    </div>
  );
}
