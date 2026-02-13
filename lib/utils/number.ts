export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safePercentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}
