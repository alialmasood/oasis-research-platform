"use client";

import { useEffect } from "react";
import "./print.css";

type PrintClientProps = {
  header: {
    academicYear: string;
    researcherName: string;
    college: string;
    department: string;
  };
  summary: {
    score: number;
    grade: string;
    status: string;
    reason: string;
    internationalStatus: string;
    date: string;
  };
  researchSummary: {
    total: number;
    published: number;
    scopus: number;
    thomson: number;
  };
  activitiesSummary: {
    conferences: number;
    seminars: number;
    workshops: number;
    committees: number;
  };
  detailRows: Array<{
    label: string;
    achieved: number;
    goal: number;
    pct: number;
    weight: number;
    impact: number;
  }>;
  standards: Array<{ label: string; value: number; met: boolean }>;
  annualProgress: number;
  improvementPlan: string[];
  charts: {
    indexing: Array<{ name: string; value: number; color: string }>;
    activities: Array<{ name: string; value: number; color: string }>;
  };
  printDate: string;
};

export function PrintClient(props: PrintClientProps) {
  useEffect(() => {
    window.print();
  }, []);

  const maxIndexing = Math.max(1, ...props.charts.indexing.map((i) => i.value));
  const maxActivities = Math.max(1, ...props.charts.activities.map((i) => i.value));

  return (
    <div className="print-report" dir="rtl">
      {/* الصفحة 1 */}
      <section className="print-page print-page-cover">
        <div className="print-header-bar">
          <img src="/uob-logo.png" alt="شعار الجامعة" className="print-logo" />
          <div className="print-header-text">
            <div className="print-university">جامعة البصرة</div>
            <div className="print-platform">منصة البحث العلمي</div>
          </div>
        </div>

        <div className="print-cover-title">تقرير التقييم والنقاط الأكاديمية</div>
        <div className="print-cover-year">العام الدراسي {props.header.academicYear}</div>

        <div className="print-researcher">
          <div>اسم الباحث: {props.header.researcherName}</div>
          <div>الكلية: {props.header.college}</div>
          <div>القسم: {props.header.department}</div>
        </div>

        <div className="print-summary-card">
          <div className="print-summary-score">
            <div className="print-score-value">{props.summary.score}</div>
            <div className="print-score-sub">/ 100 — Grade {props.summary.grade}</div>
          </div>
          <div className="print-summary-list">
            <div>الحالة العامة: <strong>{props.summary.status}</strong></div>
            <div>السبب الرئيسي: <strong>{props.summary.reason}</strong></div>
            <div>المطابقة مع المعايير الدولية: <strong>{props.summary.internationalStatus}</strong></div>
            <div>تاريخ التقييم: <strong>{props.summary.date}</strong></div>
          </div>
        </div>

        <div className="print-kpis-grid">
          <div className="print-kpi">
            <div className="print-kpi-label">إجمالي البحوث</div>
            <div className="print-kpi-value">{props.researchSummary.total}</div>
          </div>
          <div className="print-kpi">
            <div className="print-kpi-label">البحوث المنشورة</div>
            <div className="print-kpi-value">{props.researchSummary.published}</div>
          </div>
          <div className="print-kpi">
            <div className="print-kpi-label">إجمالي النشاطات</div>
            <div className="print-kpi-value">
              {props.activitiesSummary.conferences +
                props.activitiesSummary.seminars +
                props.activitiesSummary.workshops +
                props.activitiesSummary.committees}
            </div>
          </div>
          <div className="print-kpi">
            <div className="print-kpi-label">أقوى فهرسة</div>
            <div className="print-kpi-value">
              {props.researchSummary.scopus >= props.researchSummary.thomson ? "Scopus" : "Thomson"}
            </div>
          </div>
        </div>

        <div className="print-grid-2x2">
          <div className="print-box">
            <div className="print-box-title">جدول (1): ملخص البحوث الأكاديمية</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>إجمالي البحوث</th>
                  <th>بحوث منشورة</th>
                  <th>Scopus</th>
                  <th>Thomson</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">{props.researchSummary.total}</td>
                  <td className="text-center">{props.researchSummary.published}</td>
                  <td className="text-center">{props.researchSummary.scopus}</td>
                  <td className="text-center">{props.researchSummary.thomson}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="print-box">
            <div className="print-box-title">جدول (2): ملخص النشاطات الأكاديمية</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>مؤتمرات</th>
                  <th>ندوات</th>
                  <th>ورش عمل</th>
                  <th>لجان</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">{props.activitiesSummary.conferences}</td>
                  <td className="text-center">{props.activitiesSummary.seminars}</td>
                  <td className="text-center">{props.activitiesSummary.workshops}</td>
                  <td className="text-center">{props.activitiesSummary.committees}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="print-box">
            <div className="print-box-title">جدول (3): ملخص الفهرسة</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Scopus</th>
                  <th>Thomson Reuters</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">{props.researchSummary.scopus}</td>
                  <td className="text-center">{props.researchSummary.thomson}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="print-box">
            <div className="print-box-title">ملخص سريع</div>
            <div className="print-quick-summary">
              <div>
                إجمالي النشاطات:{" "}
                {props.activitiesSummary.conferences +
                  props.activitiesSummary.seminars +
                  props.activitiesSummary.workshops +
                  props.activitiesSummary.committees}
              </div>
              <div>
                أقوى فهرسة:{" "}
                {props.researchSummary.scopus >= props.researchSummary.thomson ? "Scopus" : "Thomson"}
              </div>
              <div>آخر تحديث: {props.printDate}</div>
            </div>
          </div>
        </div>
      </section>

      {/* الصفحة 2 */}
      <section className="print-page">
        <div className="print-section-title">التقييم التفصيلي (قلب التقرير)</div>
        <table className="print-table print-table-fixed print-table-detailed">
          <thead>
            <tr>
              <th>الفئة</th>
              <th>المنجز</th>
              <th>الهدف</th>
              <th>نسبة الإنجاز</th>
              <th>الوزن</th>
              <th>تأثير الوزن</th>
            </tr>
          </thead>
          <tbody>
            {props.detailRows.map((row) => (
              <tr
                key={row.label}
                className={
                  row.pct < 50 ? "print-row-low" : row.pct > 80 ? "print-row-high" : ""
                }
              >
                <td>{row.label}</td>
                <td className="text-center">{row.achieved}</td>
                <td className="text-center">{row.goal}</td>
                <td className="text-center">
                  <div className="print-pct-cell">
                    <div className="print-pct-bar">
                      <div className="print-pct-fill" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span>{row.pct}%</span>
                  </div>
                </td>
                <td className="text-center">{row.weight}</td>
                <td className="text-center">{row.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-section-title">المقارنة مع المعايير الدولية</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>المعيار</th>
              <th>القيمة</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {props.standards.map((s) => (
              <tr key={s.label}>
                <td>{s.label}</td>
                <td className="text-center">{s.value}</td>
                <td>
                  <span className={`print-badge ${s.met ? "print-badge-ok" : "print-badge-no"}`}>
                    {s.met ? "مستوفٍ" : "غير مستوفٍ"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* الصفحة 3 */}
      <section className="print-page">
        <div className="print-section-title">التقدم السنوي</div>
        <div className="print-progress">
          <div className="print-progress-bar">
            <div className="print-progress-fill" style={{ width: `${props.annualProgress}%` }} />
          </div>
          <div className="print-progress-label">{props.annualProgress}%</div>
        </div>

        <div className="print-section-title">خطة تحسين الأداء الأكاديمي المقترحة</div>
        <ol className="print-list">
          {props.improvementPlan.map((s, idx) => (
            <li key={idx}>
              {s}
              {s.includes("≈") ? "" : " (الأثر المتوقع ≈ +2)"}
            </li>
          ))}
        </ol>
        <div className="print-note">
          هذه التوصيات استرشادية وقابلة للتحديث وفق السياسة المعتمدة.
        </div>

        <div className="print-section-title">الرسوم البيانية الملخصة</div>
        <div className="print-charts-grid">
          <div className="print-box">
            <div className="print-box-title">توزيع الفهرسة</div>
            <div className="print-chart-list">
              {props.charts.indexing.map((item) => (
                <div key={item.name} className="print-chart-row">
                  <div className="print-chart-label">
                    <span className="print-chart-dot" style={{ background: item.color }} />
                    {item.name}
                  </div>
                  <div className="print-chart-bar">
                    <div
                      className="print-chart-fill"
                      style={{ width: `${(item.value / maxIndexing) * 100}%`, background: item.color }}
                    />
                  </div>
                  <div className="print-chart-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="print-box">
            <div className="print-box-title">توزيع النشاطات الأكاديمية</div>
            <div className="print-chart-list">
              {props.charts.activities.map((item) => (
                <div key={item.name} className="print-chart-row">
                  <div className="print-chart-label">
                    <span className="print-chart-dot" style={{ background: item.color }} />
                    {item.name}
                  </div>
                  <div className="print-chart-bar">
                    <div
                      className="print-chart-fill"
                      style={{ width: `${(item.value / maxActivities) * 100}%`, background: item.color }}
                    />
                  </div>
                  <div className="print-chart-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="print-report-footer">
        منصة واحة الباحث — جامعة البصرة | تاريخ الطباعة: {props.printDate} |
      </div>
    </div>
  );
}
