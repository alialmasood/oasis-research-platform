"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Form21Data, Form21Computed } from "../types";
import { PENALTY_LABELS, type PenaltyOption } from "../types";
import type { Form21Basic } from "../types";

interface Form21InputProps {
  data: Form21Data;
  computed: Form21Computed;
  onChange: (data: Form21Data) => void;
  onSave: () => void;
  isSaving?: boolean;
  /** عند وجوده تُعرض الحقول المستدعاة من النظام للقراءة فقط */
  researcherBasic: Form21Basic | null;
  /** أعلى شهادة من الشهادات العلمية (للقراءة فقط) */
  initialDegreeFromDb?: string;
}

export function Form21Input({
  data,
  computed,
  onChange,
  onSave,
  isSaving,
  researcherBasic,
  initialDegreeFromDb,
}: Form21InputProps) {
  const readonlyBasic = researcherBasic !== null;
  const readonlyDegree = readonlyBasic || !!initialDegreeFromDb;
  const setBasic = <K extends keyof Form21Data["basic"]>(
    key: K,
    value: Form21Data["basic"][K]
  ) => {
    onChange({ ...data, basic: { ...data.basic, [key]: value } });
  };

  const setAxis1 = <K extends keyof Form21Data["axis1"]>(
    key: K,
    value: Form21Data["axis1"][K]
  ) => {
    onChange({ ...data, axis1: { ...data.axis1, [key]: value } });
  };

  const setAxis1P3 = (i: number, v: boolean) => {
    const p3 = [...data.axis1.p3] as [boolean, boolean, boolean, boolean];
    p3[i] = v;
    setAxis1("p3", p3);
  };
  const setAxis1P4 = (i: number, v: boolean) => {
    const p4 = [...data.axis1.p4] as [boolean, boolean, boolean, boolean];
    p4[i] = v;
    setAxis1("p4", p4);
  };
  const setAxis1P5 = (i: number, v: boolean) => {
    const p5 = [...data.axis1.p5] as [boolean, boolean, boolean, boolean];
    p5[i] = v;
    setAxis1("p5", p5);
  };

  const setAxis2 = (key: keyof Form21Data["axis2"], value: number) => {
    onChange({ ...data, axis2: { ...data.axis2, [key]: value } });
  };
  const setAxis3 = (key: keyof Form21Data["axis3"], value: number) => {
    onChange({ ...data, axis3: { ...data.axis3, [key]: value } });
  };

  const disabled1 = data.axis1.notTeaching;

  return (
    <div className="space-y-6 no-print">
      {/* A) البيانات الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>الجامعة</Label>
              <Input
                value={data.basic.university}
                readOnly
                className="mt-1 bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-0.5">ثابت: جامعة البصرة</p>
            </div>
            <div>
              <Label>الكلية</Label>
              <Input
                value={data.basic.college}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("college", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
              {readonlyBasic && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من التشكيل التدريسي</p>
              )}
            </div>
            <div>
              <Label>القسم</Label>
              <Input
                value={data.basic.department}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("department", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
              {readonlyBasic && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من التشكيل التدريسي</p>
              )}
            </div>
            <div>
              <Label>الاسم الرباعي</Label>
              <Input
                value={data.basic.fullName}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("fullName", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
              {readonlyBasic && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من بيانات التدريسي</p>
              )}
            </div>
            <div>
              <Label>اللقب العلمي</Label>
              <Input
                value={data.basic.scientificTitle}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("scientificTitle", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div>
              <Label>الشهادة</Label>
              <Input
                value={data.basic.degree}
                readOnly={readonlyDegree}
                onChange={(e) => setBasic("degree", e.target.value)}
                className={`mt-1 ${readonlyDegree ? "bg-slate-50" : ""}`}
              />
              {readonlyDegree && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من الشهادات العلمية (أعلى شهادة)</p>
              )}
            </div>
            <div>
              <Label>الاختصاص العام</Label>
              <Input
                value={data.basic.generalSpecialization}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("generalSpecialization", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
              {readonlyBasic && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من بيانات التدريسي</p>
              )}
            </div>
            <div>
              <Label>الاختصاص الدقيق</Label>
              <Input
                value={data.basic.specificSpecialization}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("specificSpecialization", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
              {readonlyBasic && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من بيانات التدريسي</p>
              )}
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input
                value={data.basic.phone}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("phone", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
              {readonlyBasic && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من بيانات التدريسي</p>
              )}
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={data.basic.email}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("email", e.target.value)}
                className={`mt-1 ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
              {readonlyBasic && (
                <p className="text-xs text-slate-500 mt-0.5">مستدعى من بيانات التدريسي</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B) المحور الأول */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المحور الأول (الوزن 50%)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.axis1.notTeaching}
              onChange={(e) => setAxis1("notTeaching", e.target.checked)}
            />
            <span>غير مكلف بمهام تدريسية</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>الفقرة 1: عدد المقررات (سقف 20)</Label>
              <Input
                type="number"
                min={0}
                max={20}
                disabled={disabled1}
                value={data.axis1.coursesCount || ""}
                onChange={(e) =>
                  setAxis1("coursesCount", parseInt(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>الفقرة 2: نسبة استبيان (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                disabled={disabled1}
                value={data.axis1.surveyPercent || ""}
                onChange={(e) =>
                  setAxis1("surveyPercent", parseInt(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>الفقرة 3 (4 بنود × 5 = 20)</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {[0, 1, 2, 3].map((i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={disabled1}
                    checked={data.axis1.p3[i]}
                    onChange={(e) => setAxis1P3(i, e.target.checked)}
                  />
                  <span>بند {i + 1}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>الفقرة 4 (5 بنود × 4 = 20)</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={disabled1}
                    checked={data.axis1.p4[i]}
                    onChange={(e) => setAxis1P4(i, e.target.checked)}
                  />
                  <span>بند {i + 1}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>الفقرة 5 (5 بنود × 4 = 20)</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.axis1.p5[i]}
                    onChange={(e) => setAxis1P5(i, e.target.checked)}
                  />
                  <span>بند {i + 1}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C) المحور الثاني */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المحور الثاني (الوزن 30%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>الفقرة 1 (سقف 40)</Label>
              <Input
                type="number"
                min={0}
                max={40}
                value={data.axis2.item1 || ""}
                onChange={(e) =>
                  setAxis2("item1", Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>الفقرة 2 (سقف 35)</Label>
              <Input
                type="number"
                min={0}
                max={35}
                value={data.axis2.item2 || ""}
                onChange={(e) =>
                  setAxis2("item2", Math.min(35, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>الفقرة 3 (سقف 25)</Label>
              <Input
                type="number"
                min={0}
                max={25}
                value={data.axis2.item3 || ""}
                onChange={(e) =>
                  setAxis2("item3", Math.min(25, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D) المحور الثالث */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المحور الثالث (الوزن 20%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>الفقرة 1 (سقف 40)</Label>
              <Input
                type="number"
                min={0}
                max={40}
                value={data.axis3.item1 || ""}
                onChange={(e) =>
                  setAxis3("item1", Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>الفقرة 2 (سقف 35)</Label>
              <Input
                type="number"
                min={0}
                max={35}
                value={data.axis3.item2 || ""}
                onChange={(e) =>
                  setAxis3("item2", Math.min(35, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>الفقرة 3 (سقف 25)</Label>
              <Input
                type="number"
                min={0}
                max={25}
                value={data.axis3.item3 || ""}
                onChange={(e) =>
                  setAxis3("item3", Math.min(25, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* E) مواطن القوة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المحور الرابع: مواطن القوة (0–10)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            min={0}
            max={10}
            value={data.strengthScore || ""}
            onChange={(e) =>
              onChange({
                ...data,
                strengthScore: Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)),
              })
            }
            className="w-24"
          />
        </CardContent>
      </Card>

      {/* F) العقوبات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المحور الخامس: العقوبات (خصم)</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={data.penalty}
            onValueChange={(v) => onChange({ ...data, penalty: v as PenaltyOption })}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PENALTY_LABELS) as PenaltyOption[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PENALTY_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* النتائج */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base">النتائج المحسوبة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {computed.axis2Item1Zero && (
            <div className="p-3 rounded-lg bg-amber-100 text-amber-900 text-sm font-medium">
              تنبيه: درجة الفقرة 1 في المحور الثاني = 0، therefore النتيجة النهائية لا تتجاوز 75.
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">محور 1 Raw</p>
              <p className="font-semibold">{computed.axis1Raw.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">محور 1 (50%)</p>
              <p className="font-semibold">{computed.axis1Weighted.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">محور 2 Raw</p>
              <p className="font-semibold">{computed.axis2Raw.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">محور 2 (30%)</p>
              <p className="font-semibold">{computed.axis2Weighted.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">محور 3 Raw</p>
              <p className="font-semibold">{computed.axis3Raw.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">محور 3 (20%)</p>
              <p className="font-semibold">{computed.axis3Weighted.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">مواطن القوة</p>
              <p className="font-semibold">{data.strengthScore}</p>
            </div>
            <div className="p-2 rounded bg-white border">
              <p className="text-xs text-slate-500">العقوبات</p>
              <p className="font-semibold">-{computed.penaltyScore}</p>
            </div>
            <div className="p-2 rounded bg-blue-100 border border-blue-300 col-span-2">
              <p className="text-xs text-slate-600">النتيجة النهائية</p>
              <p className="text-xl font-bold text-blue-900">{computed.finalScore.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded bg-blue-100 border border-blue-300 col-span-2">
              <p className="text-xs text-slate-600">التقدير</p>
              <p className="text-xl font-bold text-blue-900">{computed.finalGrade}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          {isSaving ? "جاري الحفظ..." : "حفظ الاستمارة"}
        </Button>
      </div>
    </div>
  );
}
