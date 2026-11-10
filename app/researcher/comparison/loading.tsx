export default function Loading() {
  return (
    <div className="space-y-3 md:space-y-6">
      <div className="flex flex-col gap-2 md:gap-3">
        <div className="h-5 md:h-6 w-32 md:w-56 rounded-lg bg-slate-200" />
        <div className="hidden md:block h-4 w-96 rounded-lg bg-slate-100" />
        <div className="md:hidden h-8 w-full rounded-xl bg-slate-100" />
        <div className="hidden md:block h-4 w-72 rounded-lg bg-slate-100" />
      </div>

      <div className="grid grid-cols-2 gap-2 md:hidden">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-[64px] rounded-xl bg-slate-100" />
        ))}
      </div>

      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-2xl bg-slate-100" />
        ))}
      </div>

      <div className="grid gap-2 md:gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-28 md:h-56 rounded-xl md:rounded-2xl bg-slate-100" />
        ))}
      </div>

      <div className="grid gap-2 md:gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="h-40 md:h-80 rounded-xl md:rounded-2xl bg-slate-100" />
        <div className="h-40 md:h-80 rounded-xl md:rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
