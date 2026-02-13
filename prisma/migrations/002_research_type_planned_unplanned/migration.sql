-- تغيير نوع البحث من (BASIC, APPLIED, DEVELOPMENT, OTHER) إلى (PLANNED, UNPLANNED)
-- تشغيل هذا الملف يدوياً إذا كانت لديك بيانات قديمة: psql أو أي عميل SQL على قاعدة البحث

-- إنشاء النوع الجديد
CREATE TYPE "ResearchType_new" AS ENUM ('PLANNED', 'UNPLANNED');

-- إضافة عمود مؤقت
ALTER TABLE "research" ADD COLUMN "research_type_new" "ResearchType_new";

-- تحويل كل القيم القديمة إلى غير مخطط
UPDATE "research" SET "research_type_new" = 'UNPLANNED';

-- جعل العمود مطلوباً
ALTER TABLE "research" ALTER COLUMN "research_type_new" SET NOT NULL;

-- حذف العمود القديم وإعادة تسمية الجديد
ALTER TABLE "research" DROP COLUMN "research_type";
ALTER TABLE "research" RENAME COLUMN "research_type_new" TO "research_type";

-- حذف النوع القديم وإعادة تسمية الجديد
DROP TYPE "ResearchType";
ALTER TYPE "ResearchType_new" RENAME TO "ResearchType";
