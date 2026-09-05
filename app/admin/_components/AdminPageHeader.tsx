interface AdminPageHeaderProps {
  subtitle?: string;
  title: string;
  description?: string;
}

export function AdminPageHeader({
  subtitle = "جامعة البصرة · الخطة العلمية",
  title,
  description,
}: AdminPageHeaderProps) {
  return (
    <div>
      <p className="text-sm text-[#2563EB] font-medium mb-1">{subtitle}</p>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 shrink-0">{title}</h1>
        {description && (
          <>
            <span className="text-slate-300 font-light hidden sm:inline" aria-hidden>
              |
            </span>
            <p className="text-sm md:text-base text-slate-500 font-normal leading-snug">
              {description}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
