"use client";

import { type CSSProperties } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer } from "./chart-container";

interface PieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  title?: string;
  /** تسمية مخصصة للـ Tooltip: (اسم القطعة، القيمة) => نص */
  tooltipLabel?: (name: string, value: number) => string;
  /** موضع الليجند: على الموبايل horizontal + bottom أفضل */
  legendLayout?: "horizontal" | "vertical";
  legendVerticalAlign?: "top" | "middle" | "bottom";
  /** تنسيق الليجند (مثلاً fontSize: 11 للموبايل) */
  legendWrapperStyle?: CSSProperties;
  /** نصف القطر الداخلي (للـ Donut chart) */
  innerRadius?: number;
  /** نصف القطر الخارجي */
  outerRadius?: number;
}

export function PieChart({
  data,
  title,
  tooltipLabel,
  legendLayout = "vertical",
  legendVerticalAlign = "bottom",
  legendWrapperStyle,
  innerRadius = 0,
  outerRadius = 100,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-slate-400 text-sm">
        لا توجد بيانات للعرض
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2">
        <div className="text-2xl font-semibold text-slate-700">{data[0].value}</div>
        <div className="text-sm text-slate-500">{data[0].name}</div>
      </div>
    );
  }

  const tooltipContent = tooltipLabel
    ? ({
        active,
        payload,
      }: {
        active?: boolean;
        payload?: ReadonlyArray<{ name?: string; value?: number }>;
      }) => {
        if (!active || !payload?.length) return null;
        const name = payload[0]?.name ?? "";
        const value = payload[0]?.value ?? 0;
        const text = tooltipLabel(name, value);
        return (
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {text}
          </div>
        );
      }
    : undefined;

  return (
    <ChartContainer minHeight={160}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy={legendVerticalAlign === "bottom" ? "40%" : "50%"}
          labelLine={false}
          label={false}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={tooltipContent} />
        <Legend
          layout={legendLayout}
          verticalAlign={legendVerticalAlign}
          wrapperStyle={{
            paddingTop: legendVerticalAlign === "bottom" ? "16px" : "0",
            paddingBottom: legendVerticalAlign === "top" ? "16px" : "0",
            fontSize: "12px",
            ...legendWrapperStyle,
          }}
          iconType="circle"
          iconSize={10}
        />
      </RechartsPieChart>
    </ChartContainer>
  );
}
