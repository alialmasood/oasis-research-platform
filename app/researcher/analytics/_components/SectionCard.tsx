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
    <Card className={`border-slate-100 bg-white shadow-lg h-full ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
            {description ? <p className="text-xs text-slate-500">{description}</p> : null}
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
