-- تحديث جدول positions من الحقول القديمة إلى الجديدة
-- تشغيل هذا الملف يدوياً: psql أو أي عميل SQL على قاعدة البيانات

-- التحقق من وجود الجدول القديم
DO $$
BEGIN
    -- إذا كان الجدول يحتوي على الحقول القديمة، قم بالتحديث
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'positions' AND column_name = 'user_id'
    ) THEN
        -- إضافة الأعمدة الجديدة إذا لم تكن موجودة
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'positions' AND column_name = 'researcher_id'
        ) THEN
            ALTER TABLE "positions" ADD COLUMN "researcher_id" TEXT;
            -- نسخ البيانات من user_id إلى researcher_id
            UPDATE "positions" SET "researcher_id" = "user_id";
            -- جعل العمود مطلوباً
            ALTER TABLE "positions" ALTER COLUMN "researcher_id" SET NOT NULL;
        END IF;

        -- إضافة position_date إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'positions' AND column_name = 'position_date'
        ) THEN
            ALTER TABLE "positions" ADD COLUMN "position_date" TIMESTAMP(3);
            -- نسخ البيانات من start_date إلى position_date
            UPDATE "positions" SET "position_date" = "start_date" WHERE "start_date" IS NOT NULL;
            -- إذا كان start_date NULL، استخدم تاريخ اليوم
            UPDATE "positions" SET "position_date" = CURRENT_TIMESTAMP WHERE "position_date" IS NULL;
            ALTER TABLE "positions" ALTER COLUMN "position_date" SET NOT NULL;
        END IF;

        -- إضافة duration_years إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'positions' AND column_name = 'duration_years'
        ) THEN
            ALTER TABLE "positions" ADD COLUMN "duration_years" INTEGER NOT NULL DEFAULT 0;
            -- حساب المدة من start_date و end_date
            UPDATE "positions" 
            SET "duration_years" = EXTRACT(YEAR FROM AGE(COALESCE("end_date", CURRENT_TIMESTAMP), "start_date"))::INTEGER
            WHERE "start_date" IS NOT NULL;
        END IF;

        -- إضافة duration_months إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'positions' AND column_name = 'duration_months'
        ) THEN
            ALTER TABLE "positions" ADD COLUMN "duration_months" INTEGER NOT NULL DEFAULT 0;
            -- حساب المدة من start_date و end_date
            UPDATE "positions" 
            SET "duration_months" = EXTRACT(MONTH FROM AGE(COALESCE("end_date", CURRENT_TIMESTAMP), "start_date"))::INTEGER
            WHERE "start_date" IS NOT NULL;
        END IF;

        -- إضافة duration_days إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'positions' AND column_name = 'duration_days'
        ) THEN
            ALTER TABLE "positions" ADD COLUMN "duration_days" INTEGER NOT NULL DEFAULT 0;
            -- حساب المدة من start_date و end_date
            UPDATE "positions" 
            SET "duration_days" = EXTRACT(DAY FROM AGE(COALESCE("end_date", CURRENT_TIMESTAMP), "start_date"))::INTEGER
            WHERE "start_date" IS NOT NULL;
        END IF;

        -- حذف الأعمدة القديمة (اختياري - يمكنك الاحتفاظ بها للنسخ الاحتياطي)
        -- ALTER TABLE "positions" DROP COLUMN IF EXISTS "user_id";
        -- ALTER TABLE "positions" DROP COLUMN IF EXISTS "start_date";
        -- ALTER TABLE "positions" DROP COLUMN IF EXISTS "end_date";
        -- ALTER TABLE "positions" DROP COLUMN IF EXISTS "is_current";

        -- إضافة foreign key constraint إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'positions' 
            AND constraint_name = 'positions_researcher_id_fkey'
        ) THEN
            ALTER TABLE "positions" 
            ADD CONSTRAINT "positions_researcher_id_fkey" 
            FOREIGN KEY ("researcher_id") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
    END IF;
END $$;
