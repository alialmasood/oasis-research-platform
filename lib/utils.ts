import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** مسار عام مطلق — يمنع 404 عند مسارات نسبية مثل logo.png على /admin/* */
export function resolvePublicUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
}

/** أرقام لاتينية (0–9) بفواصل إنجليزية */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

/** تاريخ عربي بأرقام لاتينية */
export function formatDate(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("ar-IQ", {
    numberingSystem: "latn",
    ...options,
  }).format(date)
}
