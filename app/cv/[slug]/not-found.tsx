import Link from "next/link";

export default function PublicCvNotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center"
      dir="rtl"
    >
      <h1 className="text-xl font-semibold text-slate-900">السيرة غير متاحة</h1>
      <p className="text-sm text-slate-500 max-w-md">
        الرابط غير صحيح أو أن الباحث أخفى سيرته الذاتية عن المشاركة العامة.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-[#2563EB] hover:underline"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
