"use client";

import { useEffect, useState, useRef } from "react";
import { ReactNode } from "react";

interface RankStatInlineProps {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "purple" | "blue" | "amber";
}

const toneConfig = {
  purple: {
    iconColor: "text-purple-600",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
  },
  blue: {
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  amber: {
    iconColor: "text-amber-600",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
};

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function RankStatInline({
  label,
  value,
  icon,
  tone = "blue",
}: RankStatInlineProps) {
  const [displayValue, setDisplayValue] = useState(1);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const previousValueRef = useRef<number>(value);

  const config = toneConfig[tone];

  useEffect(() => {
    // Only animate if value actually changed
    if (previousValueRef.current === value && displayValue === value) {
      return;
    }

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (value <= 1) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    // Start from 1 or current display value
    const startValue = displayValue === value ? 1 : displayValue;
    startTimeRef.current = Date.now();
    const duration = 900; // 900ms

    const animate = () => {
      const now = Date.now();
      const elapsed = startTimeRef.current ? now - startTimeRef.current : 0;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = Math.floor(startValue + (value - startValue) * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        previousValueRef.current = value;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <span className={`${config.iconColor} flex-shrink-0 [&>svg]:h-3 [&>svg]:w-3 md:[&>svg]:h-3.5 md:[&>svg]:w-3.5`}>{icon}</span>
      <span className="text-[10px] md:text-xs text-slate-600 leading-tight whitespace-nowrap">{label}</span>
      <span className={`${config.badgeText} text-xs md:text-sm font-semibold transition-all duration-150`}>#{displayValue}</span>
    </span>
  );
}
