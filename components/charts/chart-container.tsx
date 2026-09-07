"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type ChartContainerProps = {
  children: ReactElement;
  className?: string;
  minHeight?: number;
};

/**
 * Waits until the parent has real pixel size before mounting Recharts
 * ResponsiveContainer — avoids width(-1)/height(-1) console warnings.
 */
export function ChartContainer({
  children,
  className,
  minHeight = 160,
}: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setReady(width > 1 && height > 1);
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative w-full h-full min-w-0", className)}
      style={{ minHeight }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={minHeight}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="absolute inset-0" aria-hidden />
      )}
    </div>
  );
}
