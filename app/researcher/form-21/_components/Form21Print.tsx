"use client";

import Image from "next/image";
import type { Form21Data, Form21Computed } from "../types";
import { PENALTY_LABELS } from "../types";

interface Form21PrintProps {
  academicYear: string;
  data: Form21Data;
  computed: Form21Computed;
}

export function Form21Print({
  academicYear,
  data,
  computed,
}: Form21PrintProps) {
  return (
    <div className="print-only" dir="rtl">
      <div className="p-4">
        {/* الهيدر */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black pb-4 mb-4">
          <div className="text-right text-sm">
            <p className="font-bold">وزارة التعليم العالي والبحث العلمي</p>
            <p>جهاز الإشراف والتقويم العلمي</p>
            <p>دائرة ضمان الجودة والاعتماد الأكاديمي</p>
            <p>قسم تقويم الأداء المؤسسي</p>
          </div>
          <div className="flex-shrink-0">
            <Image
              src="/mohesr21.png"
              alt="شعار"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div className="text-left text-sm">
            <p>رقم الاستمارة: —</p>
            <p>ترميز الاستمارة: —</p>
          </div>
        </div>

        <h2 className="text-center font-bold text-lg mb-4">
          استمارة رقم (21): تقييم أداء أعضاء الهيئة التدريسية للعام الدراسي ({academicYear})
        </h2>

        <table className="form21-print-table w-full mb-4">
          <thead>
            <tr>
              <th colSpan={2}>البيانات الأساسية</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium w-1/3">الجامعة</td>
              <td>{data.basic.university || "—"}</td>
            </tr>
            <tr>
              <td>الكلية</td>
              <td>{data.basic.college || "—"}</td>
            </tr>
            <tr>
              <td>القسم</td>
              <td>{data.basic.department || "—"}</td>
            </tr>
            <tr>
              <td>الاسم الرباعي</td>
              <td>{data.basic.fullName || "—"}</td>
            </tr>
            <tr>
              <td>اللقب العلمي</td>
              <td>{data.basic.scientificTitle || "—"}</td>
            </tr>
            <tr>
              <td>الشهادة / الاختصاص</td>
              <td>{data.basic.degree || "—"} / {data.basic.generalSpecialization || "—"} / {data.basic.specificSpecialization || "—"}</td>
            </tr>
            <tr>
              <td>الهاتف / البريد</td>
              <td>{data.basic.phone || "—"} / {data.basic.email || "—"}</td>
            </tr>
          </tbody>
        </table>

        <table className="form21-print-table w-full mb-4">
          <thead>
            <tr>
              <th>المحور</th>
              <th>الدرجة الخام</th>
              <th>الوزن</th>
              <th>الدرجة المرجحة</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>المحور الأول (التدريس)</td>
              <td>{computed.axis1Raw.toFixed(1)}</td>
              <td>50%</td>
              <td>{computed.axis1Weighted.toFixed(1)}</td>
            </tr>
            <tr>
              <td>المحور الثاني</td>
              <td>{computed.axis2Raw.toFixed(1)}</td>
              <td>30%</td>
              <td>{computed.axis2Weighted.toFixed(1)}</td>
            </tr>
            <tr>
              <td>المحور الثالث</td>
              <td>{computed.axis3Raw.toFixed(1)}</td>
              <td>20%</td>
              <td>{computed.axis3Weighted.toFixed(1)}</td>
            </tr>
            <tr>
              <td>مواطن القوة</td>
              <td colSpan={2}>{data.strengthScore}</td>
              <td>—</td>
            </tr>
            <tr>
              <td>العقوبات (خصم)</td>
              <td colSpan={3}>{PENALTY_LABELS[data.penalty]} = -{computed.penaltyScore}</td>
            </tr>
          </tbody>
        </table>

        <table className="form21-print-table w-full">
          <thead>
            <tr>
              <th>النتيجة النهائية</th>
              <th>التقدير</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-bold text-lg">{computed.finalScore.toFixed(1)}</td>
              <td className="font-bold text-lg">{computed.finalGrade}</td>
            </tr>
          </tbody>
        </table>

        {computed.axis2Item1Zero && (
          <p className="text-sm mt-2 text-amber-800">
            * تطبيق شرط عدم تجاوز النتيجة 75 لعدم وجود نشاط بحثي (الفقرة 1 المحور الثاني = 0).
          </p>
        )}
      </div>
    </div>
  );
}
