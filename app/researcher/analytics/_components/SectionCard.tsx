import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SectionCardProps = {
  title: string;
  description?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, description, headerRight, children, className }: SectionCardProps) {
  return (
    <Card
      className={`border-slate-100 bg-white shadow-sm md:shadow-lg h-full gap-3 md:gap-6 py-3 md:py-6 ${className ?? ""}`}
    >
      <CardHeader className="pb-0 md:pb-3 px-3 md:px-6 pt-0">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="min-w-0 space-y-0.5 md:space-y-1">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-900 leading-snug">
              {title}
            </CardTitle>
            {description ? (
              <p className="text-[10px] md:text-xs text-slate-500 line-clamp-1 md:line-clamp-none">
                {description}
              </p>
            ) : null}
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="px-3 md:px-6">{children}</CardContent>
    </Card>
  );
}
