"use client";

import { type CSSProperties } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer } from "./chart-container";

interface BarChartProps {
  data: Array<Record<string, any>>;
  dataKeys: string[];
  colors?: string[];
  stackId?: string;
  /** تسمية مخصصة للـ Tooltip عند hover: (اسم المحور، القيمة، مفتاح البيانات) => نص */
  tooltipLabel?: (label: string, value: number, dataKey: string) => string;
  /** موضع الليجند: على الموبايل horizontal + bottom أفضل */
  legendLayout?: "horizontal" | "vertical";
  legendVerticalAlign?: "top" | "bottom";
  /** حجم خط المحاور: موبايل 10، ديسكتوب 12 */
  tickFontSize?: number;
  /** تنسيق الليجند (مثلاً fontSize: 11 للموبايل) */
  legendWrapperStyle?: CSSProperties;
}

const defaultColors = [
  "#2563EB",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const yAxisProps = {
  allowDecimals: false,
  domain: [0, (max: number) => Math.max(1, Math.ceil(max) + 1)] as [
    number,
    string | ((max: number) => number),
  ],
  tickMargin: 8,
};

export function BarChart({
  data,
  dataKeys,
  colors = defaultColors,
  stackId,
  tooltipLabel,
  legendLayout = "vertical",
  legendVerticalAlign = "top",
  tickFontSize = 12,
  legendWrapperStyle,
}: BarChartProps) {
  const chartMargin = {
    top: legendVerticalAlign === "top" ? 24 : 8,
    right: 20,
    left: 0,
    bottom: legendVerticalAlign === "bottom" ? 28 : 8,
  };
  const tooltipContent = tooltipLabel
    ? ({
        active,
        payload,
        label,
      }: {
        active?: boolean;
        payload?: ReadonlyArray<{ value?: number; dataKey?: string }>;
        label?: string | number;
      }) => {
        if (!active || !payload?.length || label == null) return null;
        const value = payload[0]?.value ?? 0;
        const dataKey = payload[0]?.dataKey ?? dataKeys[0];
        const text = tooltipLabel(String(label), value, String(dataKey));
        return (
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
            }}
          >
            {text}
          </div>
        );
      }
    : undefined;

  return (
    <ChartContainer minHeight={160}>
      <RechartsBarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.1} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: tickFontSize }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={{ stroke: "#e5e7eb" }}
          tickMargin={8}
        />
        <YAxis
          {...yAxisProps}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip
          content={tooltipContent}
          contentStyle={
            tooltipContent
              ? undefined
              : {
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }
          }
        />
        <Legend
          layout={legendLayout}
          verticalAlign={legendVerticalAlign}
          wrapperStyle={{
            paddingTop: legendVerticalAlign === "bottom" ? "10px" : "6px",
            ...legendWrapperStyle,
          }}
          iconType="circle"
          iconSize={8}
        />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            stackId={stackId}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}
