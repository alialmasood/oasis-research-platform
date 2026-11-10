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

const cardMobile =
  "gap-3 py-3 md:gap-6 md:py-6 shadow-sm md:shadow-sm rounded-xl";
const headerMobile = "px-3 md:px-6 gap-1.5 md:gap-2";
const contentMobile = "px-3 md:px-6";
const titleMobile = "text-sm md:text-base";
const labelMobile = "text-[11px] md:text-sm";
const inputMobile = "mt-0.5 md:mt-1 h-8 md:h-9 text-[11px] md:text-sm w-full";

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

  const basicFieldClass = "min-w-0 flex flex-col";

  return (
    <div className="space-y-3 md:space-y-6 no-print">
      {/* A) البيانات الأساسية */}
      <Card className={cardMobile}>
        <CardHeader className={headerMobile}>
          <CardTitle className={titleMobile}>البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className={contentMobile}>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-x-2 gap-y-2.5 md:gap-x-4 md:gap-y-4">
            <div className={basicFieldClass}>
              <Label className={labelMobile}>الجامعة</Label>
              <Input
                value={data.basic.university}
                readOnly
                className={`${inputMobile} bg-slate-50`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>الكلية</Label>
              <Input
                value={data.basic.college}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("college", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>القسم</Label>
              <Input
                value={data.basic.department}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("department", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>الاسم الرباعي</Label>
              <Input
                value={data.basic.fullName}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("fullName", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>اللقب العلمي</Label>
              <Input
                value={data.basic.scientificTitle}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("scientificTitle", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>الشهادة</Label>
              <Input
                value={data.basic.degree}
                readOnly={readonlyDegree}
                onChange={(e) => setBasic("degree", e.target.value)}
                className={`${inputMobile} ${readonlyDegree ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>الاختصاص العام</Label>
              <Input
                value={data.basic.generalSpecialization}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("generalSpecialization", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>الاختصاص الدقيق</Label>
              <Input
                value={data.basic.specificSpecialization}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("specificSpecialization", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>الهاتف</Label>
              <Input
                value={data.basic.phone}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("phone", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
            <div className={basicFieldClass}>
              <Label className={labelMobile}>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={data.basic.email}
                readOnly={readonlyBasic}
                onChange={(e) => setBasic("email", e.target.value)}
                className={`${inputMobile} ${readonlyBasic ? "bg-slate-50" : ""}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B) المحور الأول */}
      <Card className={cardMobile}>
        <CardHeader className={headerMobile}>
          <CardTitle className={titleMobile}>المحور الأول (الوزن 50%)</CardTitle>
        </CardHeader>
        <CardContent className={`${contentMobile} space-y-3 md:space-y-4`}>
          <label className="flex items-center gap-2 text-[11px] md:text-sm">
            <input
              type="checkbox"
              checked={data.axis1.notTeaching}
              onChange={(e) => setAxis1("notTeaching", e.target.checked)}
              className="h-3.5 w-3.5 md:h-4 md:w-4"
            />
            <span>غير مكلف بمهام تدريسية</span>
          </label>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 1: عدد المقررات (سقف 20)</Label>
              <Input
                type="number"
                min={0}
                max={20}
                disabled={disabled1}
                value={data.axis1.coursesCount || ""}
                onChange={(e) =>
                  setAxis1("coursesCount", parseInt(e.target.value) || 0)
                }
                className={inputMobile}
              />
            </div>
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 2: نسبة استبيان (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                disabled={disabled1}
                value={data.axis1.surveyPercent || ""}
                onChange={(e) =>
                  setAxis1("surveyPercent", parseInt(e.target.value) || 0)
                }
                className={inputMobile}
              />
            </div>
          </div>

          <div>
            <Label className={labelMobile}>الفقرة 3 (4 بنود × 5 = 20)</Label>
            <div className="grid grid-cols-4 gap-1.5 md:flex md:flex-wrap md:gap-4 mt-1.5 md:mt-2">
              {[0, 1, 2, 3].map((i) => (
                <label
                  key={i}
                  className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm min-h-[28px] md:min-h-0"
                >
                  <input
                    type="checkbox"
                    disabled={disabled1}
                    checked={data.axis1.p3[i]}
                    onChange={(e) => setAxis1P3(i, e.target.checked)}
                    className="h-3.5 w-3.5 md:h-4 md:w-4"
                  />
                  <span>بند {i + 1}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className={labelMobile}>الفقرة 4 (5 بنود × 4 = 20)</Label>
            <div className="grid grid-cols-3 gap-1.5 md:flex md:flex-wrap md:gap-4 mt-1.5 md:mt-2 sm:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <label
                  key={i}
                  className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm min-h-[28px] md:min-h-0"
                >
                  <input
                    type="checkbox"
                    disabled={disabled1}
                    checked={data.axis1.p4[i]}
                    onChange={(e) => setAxis1P4(i, e.target.checked)}
                    className="h-3.5 w-3.5 md:h-4 md:w-4"
                  />
                  <span>بند {i + 1}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className={labelMobile}>الفقرة 5 (5 بنود × 4 = 20)</Label>
            <div className="grid grid-cols-3 gap-1.5 md:flex md:flex-wrap md:gap-4 mt-1.5 md:mt-2 sm:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <label
                  key={i}
                  className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm min-h-[28px] md:min-h-0"
                >
                  <input
                    type="checkbox"
                    checked={data.axis1.p5[i]}
                    onChange={(e) => setAxis1P5(i, e.target.checked)}
                    className="h-3.5 w-3.5 md:h-4 md:w-4"
                  />
                  <span>بند {i + 1}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C) المحور الثاني */}
      <Card className={cardMobile}>
        <CardHeader className={headerMobile}>
          <CardTitle className={titleMobile}>المحور الثاني (الوزن 30%)</CardTitle>
        </CardHeader>
        <CardContent className={contentMobile}>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 1 (سقف 40)</Label>
              <Input
                type="number"
                min={0}
                max={40}
                value={data.axis2.item1 || ""}
                onChange={(e) =>
                  setAxis2("item1", Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className={inputMobile}
              />
            </div>
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 2 (سقف 35)</Label>
              <Input
                type="number"
                min={0}
                max={35}
                value={data.axis2.item2 || ""}
                onChange={(e) =>
                  setAxis2("item2", Math.min(35, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className={inputMobile}
              />
            </div>
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 3 (سقف 25)</Label>
              <Input
                type="number"
                min={0}
                max={25}
                value={data.axis2.item3 || ""}
                onChange={(e) =>
                  setAxis2("item3", Math.min(25, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className={inputMobile}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D) المحور الثالث */}
      <Card className={cardMobile}>
        <CardHeader className={headerMobile}>
          <CardTitle className={titleMobile}>المحور الثالث (الوزن 20%)</CardTitle>
        </CardHeader>
        <CardContent className={contentMobile}>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 1 (سقف 40)</Label>
              <Input
                type="number"
                min={0}
                max={40}
                value={data.axis3.item1 || ""}
                onChange={(e) =>
                  setAxis3("item1", Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className={inputMobile}
              />
            </div>
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 2 (سقف 35)</Label>
              <Input
                type="number"
                min={0}
                max={35}
                value={data.axis3.item2 || ""}
                onChange={(e) =>
                  setAxis3("item2", Math.min(35, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className={inputMobile}
              />
            </div>
            <div className="min-w-0">
              <Label className={labelMobile}>الفقرة 3 (سقف 25)</Label>
              <Input
                type="number"
                min={0}
                max={25}
                value={data.axis3.item3 || ""}
                onChange={(e) =>
                  setAxis3("item3", Math.min(25, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className={inputMobile}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* E + F) مواطن القوة والعقوبات — جنبًا إلى جنب على الموبايل */}
      <div className="grid grid-cols-2 gap-2 md:gap-6 md:grid-cols-1">
        <Card className={`${cardMobile} h-full`}>
          <CardHeader className={headerMobile}>
            <CardTitle className={`${titleMobile} leading-snug`}>
              <span className="md:hidden">مواطن القوة (0–10)</span>
              <span className="hidden md:inline">المحور الرابع: مواطن القوة (0–10)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={contentMobile}>
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
              className={`w-full md:w-24 ${inputMobile}`}
            />
          </CardContent>
        </Card>

        <Card className={`${cardMobile} h-full`}>
          <CardHeader className={headerMobile}>
            <CardTitle className={`${titleMobile} leading-snug`}>
              <span className="md:hidden">العقوبات (خصم)</span>
              <span className="hidden md:inline">المحور الخامس: العقوبات (خصم)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={contentMobile}>
            <Select
              value={data.penalty}
              onValueChange={(v) => onChange({ ...data, penalty: v as PenaltyOption })}
            >
              <SelectTrigger className="w-full md:max-w-xs h-8 md:h-9 text-[11px] md:text-sm">
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
      </div>

      {/* النتائج — KPI موبايل + سطح المكتب دون تغيير */}
      <Card className={`${cardMobile} border-blue-200 bg-blue-50/30`}>
        <CardHeader className={headerMobile}>
          <CardTitle className={titleMobile}>النتائج المحسوبة</CardTitle>
        </CardHeader>
        <CardContent className={`${contentMobile} space-y-2`}>
          {computed.axis2Item1Zero && (
            <div className="p-2 md:p-3 rounded-lg bg-amber-100 text-amber-900 text-[10px] md:text-sm font-medium leading-snug">
              تنبيه: درجة الفقرة 1 في المحور الثاني = 0، لذلك النتيجة النهائية لا تتجاوز 75.
            </div>
          )}

          {/* KPI موبايل 2×N */}
          <div className="md:hidden space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "محور 1 Raw", value: computed.axis1Raw.toFixed(1) },
                { label: "محور 1 (50%)", value: computed.axis1Weighted.toFixed(1) },
                { label: "محور 2 Raw", value: computed.axis2Raw.toFixed(1) },
                { label: "محور 2 (30%)", value: computed.axis2Weighted.toFixed(1) },
                { label: "محور 3 Raw", value: computed.axis3Raw.toFixed(1) },
                { label: "محور 3 (20%)", value: computed.axis3Weighted.toFixed(1) },
                { label: "مواطن القوة", value: String(data.strengthScore) },
                { label: "العقوبات", value: `-${computed.penaltyScore}` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="h-[64px] rounded-xl border border-slate-100 bg-white px-2.5 py-2 min-w-0 shadow-sm flex flex-col justify-center"
                >
                  <p className="text-sm font-bold tabular-nums text-gray-900 leading-none truncate">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500 leading-tight truncate">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-[64px] rounded-xl border border-blue-200 bg-blue-100 px-2.5 py-2 min-w-0 shadow-sm flex flex-col justify-center">
                <p className="text-base font-bold tabular-nums text-blue-900 leading-none truncate">
                  {computed.finalScore.toFixed(1)}
                </p>
                <p className="mt-1 text-[10px] text-slate-600 leading-tight">النتيجة النهائية</p>
              </div>
              <div className="h-[64px] rounded-xl border border-blue-200 bg-blue-100 px-2.5 py-2 min-w-0 shadow-sm flex flex-col justify-center">
                <p className="text-base font-bold text-blue-900 leading-none truncate">
                  {computed.finalGrade}
                </p>
                <p className="mt-1 text-[10px] text-slate-600 leading-tight">التقدير</p>
              </div>
            </div>
          </div>

          {/* سطح المكتب — دون تغيير */}
          <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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

      <div className="flex justify-stretch md:justify-end">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] w-full md:w-auto h-8 md:h-9 text-[11px] md:text-sm"
        >
          {isSaving ? "جاري الحفظ..." : "حفظ الاستمارة"}
        </Button>
      </div>
    </div>
  );
}
