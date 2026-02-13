"use client";

import { Fragment, useEffect, useState } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface LineChartProps {
  data: Array<Record<string, any>>;
  dataKeys: Array<{ key: string; stroke: string }>;
  showDots?: boolean;
  gridOpacity?: number;
  /** حجم خط المحاور: على الموبايل 10، الديسكتوب 12 */
  tickFontSize?: number;
}

// قالب YAxis الصحيح لمنع 0..1 — كل القيم أعداد صحيحة
const yAxisProps = {
  allowDecimals: false,
  domain: [0, (max: number) => Math.max(1, Math.ceil(max) + 1)] as [number, string | ((max: number) => number)],
  tickMargin: 8,
};

export function LineChart({ 
  data, 
  dataKeys, 
  showDots = true,
  gridOpacity = 0.15,
  tickFontSize = 12,
}: LineChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full min-h-[160px] min-w-0" />;
  }

  return (
    <div className="w-full h-full min-h-[160px] min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
        <RechartsLineChart data={data}>
        <defs>
          {dataKeys.map(({ key, stroke }) => (
            <linearGradient key={`gradient-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#e2e8f0"
          opacity={gridOpacity}
          vertical={false}
        />
        <XAxis 
          dataKey="name" 
          tick={{ fill: "#94a3b8", fontSize: tickFontSize }}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis 
          {...yAxisProps}
          tick={{ fill: "#94a3b8", fontSize: tickFontSize }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        />
        {dataKeys.map(({ key, stroke }) => (
          <Fragment key={key}>
            {/* Gradient Area under line */}
            <Area
              type="monotone"
              dataKey={key}
              stroke="none"
              fill={`url(#gradient-${key})`}
            />
            {/* Line with dots */}
            <Line
              type="monotone"
              dataKey={key}
              stroke={stroke}
              strokeWidth={3}
              dot={showDots ? { 
                fill: stroke, 
                strokeWidth: 2, 
                r: 4,
                stroke: "white"
              } : false}
              activeDot={{ 
                r: 6, 
                fill: stroke,
                stroke: "white",
                strokeWidth: 2
              }}
            />
          </Fragment>
        ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
