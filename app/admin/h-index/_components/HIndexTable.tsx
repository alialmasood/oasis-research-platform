import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type HIndexRow = {
  id: string;
  name: string;
  entity: string | null;
  hIndex: number | null;
};

interface HIndexTableProps {
  rows: HIndexRow[];
}

export function HIndexTable({ rows }: HIndexTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-lg">
        لا يوجد باحثون مسجلون لعرض مؤشر H-Index حالياً
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="bg-[#1e3a8a] hover:bg-[#1e3a8a] border-0">
              <TableHead className="w-[64px] text-white font-semibold text-center px-3 py-3">
                #
              </TableHead>
              <TableHead className="text-white font-semibold text-right px-4 py-3">
                اسم التدريسي / الباحث
              </TableHead>
              <TableHead className="w-[220px] text-white font-semibold text-right px-4 py-3">
                اسم التشكيل
              </TableHead>
              <TableHead className="w-[140px] text-white font-semibold text-center px-3 py-3">
                H-Index
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.id}
                className={cn(
                  "border-b border-slate-100 transition-colors",
                  index % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                  "hover:bg-blue-50/40"
                )}
              >
                <TableCell className="text-center text-slate-500 font-medium px-3 py-3 tabular-nums">
                  {index + 1}
                </TableCell>
                <TableCell className="text-right px-4 py-3">
                  <span className="font-medium text-slate-900" dir="auto">
                    {row.name}
                  </span>
                </TableCell>
                <TableCell className="text-right px-4 py-3">
                  <span className="text-slate-700" dir="auto">
                    {row.entity?.trim() || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-center px-3 py-3">
                  {row.hIndex == null ? (
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400 tabular-nums">
                      —
                    </span>
                  ) : (
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-sm font-semibold text-[#1e3a8a] tabular-nums">
                      {row.hIndex}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-500">
        إجمالي الباحثين: {rows.length.toLocaleString("ar-IQ")} · قيم H-Index ستُربط لاحقاً بمنطق الجلب
      </div>
    </div>
  );
}
