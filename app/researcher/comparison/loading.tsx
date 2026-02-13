export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="h-6 w-56 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 rounded-lg bg-slate-100" />
        <div className="h-4 w-72 rounded-lg bg-slate-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-2xl bg-slate-100" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-56 rounded-2xl bg-slate-100" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="h-80 rounded-2xl bg-slate-100" />
        <div className="h-80 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
