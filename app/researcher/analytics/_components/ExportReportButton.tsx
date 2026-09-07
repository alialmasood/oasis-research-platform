"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type {
  AnalyticsComparison,
  AnalyticsConferences,
  AnalyticsHeatmapCell,
  AnalyticsInsights,
  AnalyticsKpis,
  AnalyticsPerformance,
  AnalyticsPublications,
  AnalyticsTimelinePoint,
} from "@/lib/analytics/analyticsTypes";

type ExportReportButtonProps = {
  kpis: AnalyticsKpis;
  timeline: AnalyticsTimelinePoint[];
  insights: AnalyticsInsights;
  performance: AnalyticsPerformance;
  publications: AnalyticsPublications;
  conferences: AnalyticsConferences;
  heatmap: AnalyticsHeatmapCell[];
  compare?: AnalyticsComparison;
  from: string;
  to: string;
  granularity: "month" | "year";
  researcherName?: string;
};

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatSignedPct(value: number) {
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}

function tableRows(rows: string[][]) {
  if (rows.length === 0) {
    return `<tr><td colspan="6" class="empty">لا توجد بيانات متاحة لهذا القسم.</td></tr>`;
  }
  return rows
    .map(
      (cols) =>
        `<tr>${cols.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");
}

export function ExportReportButton({
  kpis,
  timeline,
  insights,
  performance,
  publications,
  conferences,
  heatmap,
  compare,
  from,
  to,
  granularity,
  researcherName,
}: ExportReportButtonProps) {
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const generatedAt = new Date().toLocaleString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const timelineRows = tableRows(
      timeline.map((row) => [
        row.label,
        String(row.total),
        String(row.research),
        String(row.conference),
        String(row.workshop),
        String(row.committee),
      ])
    );

    const performanceRows = tableRows(
      performance.yearly.map((row) => [
        String(row.year),
        String(row.count),
        String(row.average),
      ])
    );

    const publicationVenueRows = tableRows(
      publications.topVenues.slice(0, 8).map((row) => [row.name, String(row.value)])
    );

    const publicationYearRows = tableRows(
      publications.yearly.map((row) => [String(row.year), String(row.count)])
    );

    const conferenceYearRows = tableRows(
      conferences.yearly.map((row) => [String(row.year), String(row.count)])
    );

    const conferenceScopeRows = tableRows(
      conferences.scopeShares.map((row) => [row.name, String(row.value)])
    );

    const heatmapSorted = [...heatmap].sort((a, b) => b.value - a.value);
    const topHeat = heatmapSorted.slice(0, 6);
    const lowHeat = [...heatmap].sort((a, b) => a.value - b.value).slice(0, 6);

    const recommendationsHtml =
      insights.recommendations.length > 0
        ? insights.recommendations
            .map(
              (rec, index) => `
              <li>
                <span class="rec-num">${index + 1}</span>
                <span>${escapeHtml(rec)}</span>
              </li>`
            )
            .join("")
        : `<li class="empty-rec">لا توجد توصيات حالياً.</li>`;

    const compareSection = compare
      ? `
      <section class="section">
        <div class="section-head">
          <h2>مقارنة الفترات</h2>
          <p>نسب التغير بين الفترة الحالية والفترة المقارنة</p>
        </div>
        <div class="kpi-grid five">
          <div class="kpi-card tone-slate">
            <div class="kpi-label">إجمالي النشاط</div>
            <div class="kpi-value">${escapeHtml(formatSignedPct(compare.delta.total))}</div>
          </div>
          <div class="kpi-card tone-blue">
            <div class="kpi-label">البحوث</div>
            <div class="kpi-value">${escapeHtml(formatSignedPct(compare.delta.research))}</div>
          </div>
          <div class="kpi-card tone-emerald">
            <div class="kpi-label">المؤتمرات</div>
            <div class="kpi-value">${escapeHtml(formatSignedPct(compare.delta.conference))}</div>
          </div>
          <div class="kpi-card tone-amber">
            <div class="kpi-label">الورش</div>
            <div class="kpi-value">${escapeHtml(formatSignedPct(compare.delta.workshop))}</div>
          </div>
          <div class="kpi-card tone-sky">
            <div class="kpi-label">اللجان</div>
            <div class="kpi-value">${escapeHtml(formatSignedPct(compare.delta.committee))}</div>
          </div>
        </div>
      </section>`
      : "";

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>تقرير التحليلات الزمنية</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --ink: #0f172a;
      --muted: #64748b;
      --line: #e2e8f0;
      --paper: #ffffff;
      --soft: #f8fafc;
      --blue: #2563eb;
      --blue-soft: #eff6ff;
      --emerald: #059669;
      --emerald-soft: #ecfdf5;
      --amber: #d97706;
      --amber-soft: #fffbeb;
      --rose: #e11d48;
      --rose-soft: #fff1f2;
      --sky: #0284c7;
      --sky-soft: #f0f9ff;
      --slate-soft: #f1f5f9;
    }

    * { box-sizing: border-box; }

    @page {
      size: A4;
      margin: 14mm 12mm;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #eef2f7;
      color: var(--ink);
      font-family: "Cairo", "Segoe UI", Tahoma, Arial, sans-serif;
      direction: rtl;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 12px auto;
      background: var(--paper);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      padding: 16mm 14mm;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      border-bottom: 2px solid #dbeafe;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }

    .brand-block h1 {
      margin: 0;
      font-size: 22px;
      color: #1e3a8a;
      letter-spacing: -0.02em;
    }

    .brand-block .subtitle {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.7;
    }

    .meta-card {
      min-width: 180px;
      background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
      border: 1px solid #dbeafe;
      border-radius: 14px;
      padding: 10px 12px;
      font-size: 11px;
      color: var(--muted);
      line-height: 1.8;
    }

    .meta-card strong {
      color: #1e40af;
      display: block;
      margin-bottom: 2px;
      font-size: 12px;
    }

    .section {
      margin-top: 18px;
      page-break-inside: avoid;
    }

    .section-head {
      margin-bottom: 10px;
    }

    .section-head h2 {
      margin: 0;
      font-size: 15px;
      color: #1e3a8a;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .section-head h2::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #93c5fd;
      display: inline-block;
    }

    .section-head p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 11px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .kpi-grid.five {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .kpi-grid.three {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .kpi-card {
      border-radius: 14px;
      border: 1px solid var(--line);
      padding: 12px;
      background: var(--soft);
      min-height: 78px;
    }

    .kpi-label {
      font-size: 11px;
      color: var(--muted);
    }

    .kpi-value {
      margin-top: 6px;
      font-size: 20px;
      font-weight: 700;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
    }

    .kpi-hint {
      margin-top: 4px;
      font-size: 10px;
      color: var(--muted);
    }

    .tone-blue { background: var(--blue-soft); border-color: #bfdbfe; }
    .tone-emerald { background: var(--emerald-soft); border-color: #a7f3d0; }
    .tone-amber { background: var(--amber-soft); border-color: #fde68a; }
    .tone-sky { background: var(--sky-soft); border-color: #bae6fd; }
    .tone-slate { background: var(--slate-soft); border-color: #cbd5e1; }
    .tone-rose { background: var(--rose-soft); border-color: #fecdd3; }

    .insight-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .insight-card {
      border-radius: 14px;
      border: 1px solid var(--line);
      padding: 12px;
      min-height: 110px;
    }

    .insight-card .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      margin-bottom: 8px;
    }

    .insight-card p {
      margin: 0;
      font-size: 12px;
      line-height: 1.8;
      font-weight: 600;
      color: #0f172a;
    }

    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-growth { background: #d1fae5; color: #065f46; }
    .badge-highlight { background: #dbeafe; color: #1e40af; }

    .recs {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .recs li {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.7;
      color: #334155;
    }

    .rec-num {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid var(--line);
    }

    th, td {
      padding: 8px 10px;
      text-align: right;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }

    th {
      background: #eff6ff;
      color: #1e3a8a;
      font-weight: 700;
    }

    tr:nth-child(even) td { background: #f8fafc; }
    tr:last-child td { border-bottom: none; }
    td.empty { text-align: center; color: var(--muted); background: #fff !important; }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      background: #fff;
    }

    .panel h3 {
      margin: 0 0 8px;
      font-size: 12px;
      color: #1e40af;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .chip {
      border-radius: 999px;
      border: 1px solid #dbeafe;
      background: #eff6ff;
      color: #1e3a8a;
      font-size: 10px;
      padding: 4px 8px;
    }

    .chip.soft {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #475569;
    }

    .footer {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 10px;
    }

    .print-hint {
      width: 210mm;
      margin: 0 auto 8px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }

    @media print {
      html, body { background: white; }
      .sheet {
        width: auto;
        min-height: auto;
        margin: 0;
        box-shadow: none;
        padding: 0;
      }
      .print-hint { display: none; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-hint">سيتم فتح نافذة الطباعة — اختر حفظ كـ PDF ومقاس الورق A4</div>
  <div class="sheet">
    <header class="report-header">
      <div class="brand-block">
        <h1>تقرير التحليلات الزمنية</h1>
        <p class="subtitle">
          واحة الباحث — تقرير أكاديمي شامل يتضمن المؤشرات، التحليلات الذكية، التوصيات، وتفاصيل النشاط عبر الزمن.
          ${researcherName ? `<br/>الباحث: <strong>${escapeHtml(researcherName)}</strong>` : ""}
        </p>
      </div>
      <div class="meta-card">
        <strong>بيانات التقرير</strong>
        الفترة: ${escapeHtml(formatDateLabel(from))} → ${escapeHtml(formatDateLabel(to))}<br/>
        التجميع: ${granularity === "year" ? "سنوي" : "شهري"}<br/>
        تاريخ الإصدار: ${escapeHtml(generatedAt)}
      </div>
    </header>

    <section class="section">
      <div class="section-head">
        <h2>التحليلات الذكية</h2>
        <p>إشارات سريعة تساعد على فهم الأداء واتخاذ قرار عملي</p>
      </div>
      <div class="insight-grid">
        <div class="insight-card tone-amber">
          <span class="badge badge-warning">تنبيه</span>
          <p>${escapeHtml(insights.warningText)}</p>
        </div>
        <div class="insight-card tone-emerald">
          <span class="badge badge-growth">النمو</span>
          <p>${escapeHtml(insights.growthText)}</p>
        </div>
        <div class="insight-card tone-blue">
          <span class="badge badge-highlight">أبرز نقطة</span>
          <p>${escapeHtml(insights.highlightText)}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>التوصيات العملية</h2>
        <p>خطوات مرتبة لرفع النشاط وتحسين التوزيع خلال الفترة القادمة</p>
      </div>
      <ol class="recs">
        ${recommendationsHtml}
      </ol>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>المؤشرات الرئيسية</h2>
        <p>ملخص رقمي شامل لنشاط الفترة المحددة</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card tone-slate">
          <div class="kpi-label">إجمالي النشاط</div>
          <div class="kpi-value">${escapeHtml(kpis.total)}</div>
          <div class="kpi-hint">النمو: ${escapeHtml(formatSignedPct(kpis.growthPct))}</div>
        </div>
        <div class="kpi-card tone-blue">
          <div class="kpi-label">البحوث المنشورة</div>
          <div class="kpi-value">${escapeHtml(kpis.researchPublished)}</div>
        </div>
        <div class="kpi-card tone-emerald">
          <div class="kpi-label">المؤتمرات</div>
          <div class="kpi-value">${escapeHtml(kpis.conference)}</div>
        </div>
        <div class="kpi-card tone-amber">
          <div class="kpi-label">الورش</div>
          <div class="kpi-value">${escapeHtml(kpis.workshop)}</div>
        </div>
        <div class="kpi-card tone-sky">
          <div class="kpi-label">اللجان</div>
          <div class="kpi-value">${escapeHtml(kpis.committee)}</div>
        </div>
        <div class="kpi-card tone-blue">
          <div class="kpi-label">المعدل الشهري</div>
          <div class="kpi-value">${escapeHtml(kpis.monthlyRate)}</div>
        </div>
        <div class="kpi-card tone-amber">
          <div class="kpi-label">أفضل فترة</div>
          <div class="kpi-value" style="font-size:16px">${escapeHtml(kpis.bestPeriodLabel)}</div>
        </div>
        <div class="kpi-card tone-slate">
          <div class="kpi-label">إجمالي البحوث</div>
          <div class="kpi-value">${escapeHtml(kpis.research)}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>تحليل الأداء عبر السنوات</h2>
        <p>أفضل وأضعف سنة ومتوسط الإنتاج السنوي</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card tone-emerald">
          <div class="kpi-label">أفضل سنة</div>
          <div class="kpi-value">${escapeHtml(performance.bestYear?.year ?? "—")}</div>
          <div class="kpi-hint">${performance.bestYear ? `${escapeHtml(performance.bestYear.count)} نشاط` : "لا تتوفر بيانات"}</div>
        </div>
        <div class="kpi-card tone-rose">
          <div class="kpi-label">أضعف سنة</div>
          <div class="kpi-value">${escapeHtml(performance.worstYear?.year ?? "—")}</div>
          <div class="kpi-hint">${performance.worstYear ? `${escapeHtml(performance.worstYear.count)} نشاط` : "لا تتوفر بيانات"}</div>
        </div>
        <div class="kpi-card tone-blue">
          <div class="kpi-label">متوسط النشاط السنوي</div>
          <div class="kpi-value">${escapeHtml(performance.averagePerYear)}</div>
        </div>
        <div class="kpi-card tone-slate">
          <div class="kpi-label">سنوات النشاط</div>
          <div class="kpi-value">${escapeHtml(performance.yearsCount)}</div>
          <div class="kpi-hint">إجمالي الأنشطة: ${escapeHtml(performance.totalActivities)}</div>
        </div>
      </div>
      <div style="margin-top:10px">
        <table>
          <thead>
            <tr>
              <th>السنة</th>
              <th>عدد الأنشطة</th>
              <th>المتوسط</th>
            </tr>
          </thead>
          <tbody>${performanceRows}</tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>تفصيل النشاط عبر الزمن</h2>
        <p>جدول شامل حسب وحدات التجميع المختارة</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>الفترة</th>
            <th>الإجمالي</th>
            <th>بحوث</th>
            <th>مؤتمرات</th>
            <th>ورش</th>
            <th>لجان</th>
          </tr>
        </thead>
        <tbody>${timelineRows}</tbody>
      </table>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>المنشورات والمؤتمرات</h2>
        <p>توزيع الجهات والنطاقات والأداء السنوي</p>
      </div>
      <div class="two-col">
        <div class="panel">
          <h3>أبرز جهات النشر</h3>
          <table>
            <thead><tr><th>الجهة</th><th>العدد</th></tr></thead>
            <tbody>${publicationVenueRows}</tbody>
          </table>
          <div style="margin-top:10px">
            <h3>النشر حسب السنة</h3>
            <table>
              <thead><tr><th>السنة</th><th>العدد</th></tr></thead>
              <tbody>${publicationYearRows}</tbody>
            </table>
          </div>
          <p class="kpi-hint" style="margin-top:8px">
            متوسط النشر السنوي: ${escapeHtml(publications.averagePerYear)}
            ${
              publications.peakYears.length
                ? ` — سنوات الذروة: ${escapeHtml(publications.peakYears.join("، "))}`
                : ""
            }
          </p>
        </div>
        <div class="panel">
          <h3>المؤتمرات حسب السنة</h3>
          <table>
            <thead><tr><th>السنة</th><th>العدد</th></tr></thead>
            <tbody>${conferenceYearRows}</tbody>
          </table>
          <div style="margin-top:10px">
            <h3>نطاق المؤتمرات</h3>
            <table>
              <thead><tr><th>النطاق</th><th>العدد</th></tr></thead>
              <tbody>${conferenceScopeRows}</tbody>
            </table>
          </div>
          <div style="margin-top:10px">
            <h3>أنواع المشاركة</h3>
            <div class="chip-list">
              ${
                conferences.participationShares.length
                  ? conferences.participationShares
                      .map(
                        (row) =>
                          `<span class="chip">${escapeHtml(row.name)}: ${escapeHtml(row.value)}</span>`
                      )
                      .join("")
                  : `<span class="chip soft">لا توجد بيانات</span>`
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>حرارة النشاط</h2>
        <p>أكثر الأشهر نشاطًا وأشهر الركود خلال آخر الفترات المتاحة</p>
      </div>
      <div class="two-col">
        <div class="panel">
          <h3>أعلى نشاط</h3>
          <div class="chip-list">
            ${
              topHeat.length
                ? topHeat
                    .map(
                      (cell) =>
                        `<span class="chip">${escapeHtml(cell.label)} (${escapeHtml(cell.value)})</span>`
                    )
                    .join("")
                : `<span class="chip soft">لا توجد بيانات</span>`
            }
          </div>
        </div>
        <div class="panel">
          <h3>أقل نشاط</h3>
          <div class="chip-list">
            ${
              lowHeat.length
                ? lowHeat
                    .map(
                      (cell) =>
                        `<span class="chip soft">${escapeHtml(cell.label)} (${escapeHtml(cell.value)})</span>`
                    )
                    .join("")
                : `<span class="chip soft">لا توجد بيانات</span>`
            }
          </div>
        </div>
      </div>
    </section>

    ${compareSection}

    <footer class="footer">
      <span>واحة الباحث — تقرير التحليلات الزمنية</span>
      <span>مقاس الطباعة المعتمد: A4 — ألوان هادئة للعرض الرسمي</span>
    </footer>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 350);
    });
  </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Button onClick={handleExportPDF} variant="outline" className="h-10 rounded-xl shrink-0 bg-white">
      <span className="inline-flex items-center gap-2">
        <FileDown className="h-4 w-4" />
        تصدير التقرير
      </span>
    </Button>
  );
}
