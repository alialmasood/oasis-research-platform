import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SectionCardProps = {
  title: string;
  description?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionCard({ title, description, headerRight, children }: SectionCardProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3 border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
        {description ? <p className="text-xs text-slate-500 mt-1">{description}</p> : null}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
