"use client";

import { Button } from "@/components/ui/button";
import type { AnalyticsInsights, AnalyticsKpis, AnalyticsTimelinePoint } from "@/lib/analytics/analyticsTypes";

type ExportReportButtonProps = {
  kpis: AnalyticsKpis;
  timeline: AnalyticsTimelinePoint[];
  insights: AnalyticsInsights;
  from: string;
  to: string;
  granularity: "month" | "year";
};

export function ExportReportButton({ kpis, timeline, insights, from, to, granularity }: ExportReportButtonProps) {
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const timelineRows = timeline
      .map(
        (row) => `
        <tr>
          <td>${row.label}</td>
          <td>${row.total}</td>
          <td>${row.research}</td>
          <td>${row.conference}</td>
          <td>${row.workshop}</td>
          <td>${row.committee}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير التحليلات الزمنية</title>
          <style>
            body { font-family: "Cairo", Arial, sans-serif; padding: 20px; direction: rtl; color: #111827; }
            h1 { text-align: center; color: #1f2937; margin-bottom: 8px; }
            .subtitle { text-align: center; color: #6b7280; margin-bottom: 24px; font-size: 12px; }
            .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #ffffff; }
            .label { font-size: 12px; color: #6b7280; }
            .value { font-size: 18px; font-weight: 600; color: #111827; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; vertical-align: top; }
            th { background: #f8fafc; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
            .section-title { margin: 20px 0 8px; font-weight: 600; color: #111827; }
            ul { margin: 8px 0 0; padding: 0 16px 0 0; }
            li { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>تقرير التحليلات الزمنية</h1>
          <div class="subtitle">البيانات من ${from} إلى ${to} — عرض ${granularity === "year" ? "سنوي" : "شهري"}</div>

          <div class="section-title">مؤشرات الأداء (KPI)</div>
          <div class="grid">
            <div class="card"><div class="label">إجمالي النشاط</div><div class="value">${kpis.total}</div></div>
            <div class="card"><div class="label">البحوث (منشورة)</div><div class="value">${kpis.researchPublished}</div></div>
            <div class="card"><div class="label">المؤتمرات</div><div class="value">${kpis.conference}</div></div>
            <div class="card"><div class="label">الورش</div><div class="value">${kpis.workshop}</div></div>
            <div class="card"><div class="label">اللجان</div><div class="value">${kpis.committee}</div></div>
            <div class="card"><div class="label">المعدل الشهري</div><div class="value">${kpis.monthlyRate}</div></div>
            <div class="card"><div class="label">أفضل فترة</div><div class="value">${kpis.bestPeriodLabel}</div></div>
            <div class="card"><div class="label">معدل النمو</div><div class="value">${kpis.growthPct}%</div></div>
          </div>

          <div class="section-title">رسم النشاط عبر الزمن (جدول تفصيلي)</div>
          <table>
            <thead>
              <tr>
                <th>الفترة</th>
                <th>إجمالي النشاط</th>
                <th>بحوث</th>
                <th>مؤتمرات</th>
                <th>ورش</th>
                <th>لجان</th>
              </tr>
            </thead>
            <tbody>
              ${timelineRows || `<tr><td colspan="6">لا توجد بيانات للفترة المحددة.</td></tr>`}
            </tbody>
          </table>

          <div class="section-title">المؤشرات الذكية</div>
          <ul>
            <li>${insights.growthText}</li>
            <li>${insights.warningText}</li>
            <li>${insights.highlightText}</li>
          </ul>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <Button onClick={handleExportPDF} variant="outline" className="bg-white">
      تصدير التقرير (PDF)
    </Button>
  );
}
