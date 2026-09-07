# Prisma Production Baseline — Phase 4.5

هذا المستند يجهّز تطبيق migrations على PostgreSQL الإنتاجي بعد ظهور `P3005`.
**لا يُنفَّذ على production من هذا المستند تلقائيًا** — نفّذ الأوامر يدويًا بعد backup واكتشاف الحالة.

## 1) لماذا حدث P3005؟

قاعدة الإنتاج (ومثلها التطوير حاليًا من ناحية التاريخ):

- غير فارغة (جداول وبيانات موجودة).
- لا يوجد جدول `_prisma_migrations` (لم تُدار تاريخيًا عبر Prisma Migrate).
- الـ schema بُنيت عبر `db push` / SQL يدوي / seed، وليس عبر `migrate deploy`.

لذلك `prisma migrate deploy` يرفض البدء على DB غير فارغة بلا migration history → **P3005**.

## 2) migrations المعترف بها من Prisma

Prisma يرى **3** مجلدات فقط تحت `prisma/migrations`:

| الترتيب | الاسم | ماذا تفعل | ملاحظات |
|---|---|---|---|
| 1 | `002_research_type_planned_unplanned` | تحويل `ResearchType` إلى `PLANNED`/`UNPLANNED` | **ليست idempotent** — خطر إعادة التشغيل |
| 2 | `003_update_positions_table` | تحديث أعمدة `positions` إلى `researcher_id` + تواريخ المدة | فيها حراسة `IF EXISTS` جزئيًا |
| 3 | `004_add_session_version_and_super_admin_audit_log` | `users.session_version` + جدول audit + indexes | Phase 4 — آمنة نسبيًا (`IF NOT EXISTS`) |

ملف `001_init_db_functions.sql` في جذر migrations **ليس** migration Prisma (ملف SQL منفصل، لا مجلد `migration.sql`).

لا يوجد migration ابتدائي ينشئ كل جداول المنصة — الـ baseline هنا يعني «تعليم التغييرات التراكمية كـ applied» وليس إنشاء schema من الصفر.

## 3) حالة Development

### قبل Phase 4.6
- `_prisma_migrations`: غير موجود
- محتوى 002/003/004 موجود عبر `db push`
- Drift: schema منتهية + تاريخ migrations فارغ

### بعد Phase 4.6 (Development فقط)
تم التحقق ثم:

```powershell
npx prisma migrate resolve --applied "002_research_type_planned_unplanned"
npx prisma migrate resolve --applied "003_update_positions_table"
npx prisma migrate resolve --applied "004_add_session_version_and_super_admin_audit_log"
```

النتيجة:
- `_prisma_migrations` موجود
- الثلاث migrations مسجّلة applied
- `npx prisma migrate status` → **Database schema is up to date!**
- لم يُستخدم `db push` في Phase 4.6
- لم تُعدَّل ملفات SQL migrations أو schema لهذه المرحلة

ملاحظة: `migration_lock.toml` لم يُنشأ تلقائيًا بعد `resolve` في هذا المشروع (Prisma 7). لا تُنشئه يدويًا؛ راقبه عند أول `migrate dev` حقيقي لاحقًا.

---

## سياسة Development (من الآن فصاعدًا)

لأي تغيير schema جديد:

```powershell
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

**ممنوع كـ workflow اعتيادي:**

```powershell
npx prisma db push
```

يُسمح بـ `db push` فقط في تجارب محلية استثنائية ومقصودة، وليس للنشر ولا لمواءمة التاريخ.

لا تستخدم `prisma migrate deploy` كبديل يومي عن `migrate dev` في التطوير عند إنشاء migrations جديدة.

---

## سياسة Production

```powershell
npx prisma migrate deploy
npx prisma generate
```

**ممنوع على الإنتاج:**

```powershell
npx prisma migrate dev
npx prisma db push
```

قبل أول `migrate deploy` على إنتاج بلا تاريخ: اتبع قسم Baseline أدناه (resolve لـ 002/003 فقط إن أكدها discovery، ثم deploy لـ 004).

---

## 4) قاعدة ذهبية قبل `resolve --applied`

على **production** لا تعتبر أي migration applied إلا بعد discovery يؤكد البنية.

### يجب التحقق قبل baseline لـ 002

```sql
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'ResearchType'
ORDER BY e.enumsortorder;
```

المتوقع إن كانت 002 منتهية أصلًا: `PLANNED`, `UNPLANNED` فقط.

- إن طابقت → `resolve --applied 002_...`
- إن كانت قيم قديمة (`BASIC`/`APPLIED`/...) → **لا** baseline؛ تحتاج تطبيق حقيقي بعد تقييم بيانات البحث (migration 002 تحدّث كل القيم إلى `UNPLANNED`).

### يجب التحقق قبل baseline لـ 003

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'positions'
  AND column_name IN ('user_id','researcher_id','position_date','duration_years');
```

المتوقع: وجود `researcher_id` و`position_date` (وعدم الاعتماد على `user_id` القديم في التطبيق الحالي).

### يجب التحقق قبل deploy لـ 004

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='users' AND column_name='session_version';

SELECT table_name FROM information_schema.tables
WHERE table_name='super_admin_audit_logs';
```

المتوقع على production قبل Phase 4: **غير موجودين** → لا تضع 004 في `resolve --applied`؛ طبّقها عبر `migrate deploy`.

## 5) Backup (قبل أي resolve/deploy)

Windows Server + PostgreSQL — لا تضع كلمة المرور في سطر الأوامر:

```powershell
$env:PGPASSWORD = Read-Host -AsSecureString | ConvertFrom-SecureString # أو عيّنها بأمان من Secret Store
# الأفضل:
$env:PGPASSWORD = "<من مدير الأسرار / prompt آمن>"

pg_dump `
  -h <HOST> `
  -p <PORT> `
  -U <USER> `
  -d <DB_NAME> `
  -Fc `
  -f "D:\Backups\research_platform_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

Remove-Item Env:PGPASSWORD
```

تحقق من حجم الملف وعدم كونه فارغًا قبل المتابعة.

## 6) Discovery على الإنتاج (قراءة فقط)

```powershell
cd D:\Sites\research_platform

# لا تطبع DATABASE_URL كاملًا في السجلات
if ($env:DATABASE_URL) { "DATABASE_URL_SET=yes" } else { "DATABASE_URL_SET=no" }

npx prisma -v
npx prisma migrate status

# introspection عبر SQL (psql أو أي عميل) — انظر استعلامات القسم 4
```

أو شغّل سكربت الفحص المحلي بعد ضبط `DATABASE_URL` للإنتاج بحذر:

```powershell
npx tsx scripts/phase45-dev-db-inspect.ts
```

(لا تسجّل نتائج تحتوي بيانات حساسة في تذاكر عامة.)

## 7) أوامر Baseline الدقيقة (بعد نجاح discovery)

### السيناريو المتوقع (إنتاج متوافق بنيويًا مع ما قبل Phase 4)

`002` و`003` موجودان بنيويًا، و`004` غير موجودة:

```powershell
cd D:\Sites\research_platform

npx prisma migrate status

npx prisma migrate resolve --applied "002_research_type_planned_unplanned"
npx prisma migrate resolve --applied "003_update_positions_table"

# لا تضع 004 هنا

npx prisma migrate deploy
npx prisma generate
```

النتيجة المتوقعة: `migrate deploy` ينفّذ فقط  
`004_add_session_version_and_super_admin_audit_log`.

### إذا discovery أظهر أن 002 أو 003 غير مكتملين

**توقف.** لا `resolve --applied` لتلك الـ migration. راجع المخاطر مع مالك البيانات قبل أي تطبيق فعلي.

## 8) التحقق بعد deploy

```powershell
npx prisma migrate status
```

SQL:

```sql
-- يجب أن تكون كل من 002/003/004 مسجّلة في _prisma_migrations
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at;

SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name='users' AND column_name='session_version';
-- expect: integer, default 0, NOT NULL

SELECT to_regclass('public.super_admin_audit_logs');
```

تطبيق:

1. `npm run build` ثم restart لخدمة التطبيق.
2. Login Admin / Researcher / Super Admin.
3. JWT قديمة بدون `sessionVersion` → يجب أن تصبح invalid (سلوك Phase 4 مقصود).
4. Login جديد يصدر JWT بـ `sessionVersion: 0` للمستخدمين الحاليين.

## 9) إذا فشلت migration 004 جزئيًا

Prisma لا يوفّر rollback تلقائيًا.

1. **لا** تستخدم `migrate resolve` عشوائيًا لإخفاء الفشل.
2. افحص DB: هل `session_version` أُضيف؟ هل جدول audit وُجد؟ هل فشلت indexes فقط؟
3. إذا حالة غير واضحة أو بيانات مهددة → **استعد من `pg_dump`**.
4. إذا التغيير جزئي وآمن → أصلح للأمام (forward-fix) بـ SQL يدوي متوافق ثم سجّل الحالة بحذر بعد مراجعة.
5. أعد المحاولة فقط بعد فهم سبب الفشل.

SQL لـ 004 يستخدم `IF NOT EXISTS`، لذا إعادة تشغيلها غالبًا آمنة إن فشلت في منتصف إنشاء indexes — لكن القرار يعتمد على رسالة الخطأ الفعلية.

## 10) Development — منتهٍ في Phase 4.6

تمت مواءمة تاريخ التطوير عبر `migrate resolve --applied` للثلاث migrations بعد verification.
انظر قسم «حالة Development» و«سياسة Development» أعلاه.

لا تكرر resolve على Development إلا إذا أُعيد إنشاء DB فارغة بلا تاريخ.

## 11) مراجعة مختصرة لـ 004

- يضيف `users.session_version INTEGER NOT NULL DEFAULT 0` → المستخدمون الحاليون يأخذون `0` بدون فشل NOT NULL.
- ينشئ `super_admin_audit_logs` + 5 indexes.
- لا يحذف أعمدة/جداول، لا يمس كلمات المرور، لا يغيّر بيانات المستخدمين.

## 12) مخاطر قبل الإنتاج

1. تعليم `002` كـ applied بينما enum قديم ما زال على الإنتاج.
2. إعادة تشغيل `002` على DB محدَّثة أصلًا (تحويلات عمود/نوع غير idempotent).
3. تشغيل `migrate deploy` قبل `resolve` → P3005 من جديد.
4. تعليم `004` كـ applied على الإنتاج قبل وجود الأعمدة/الجدول.
5. غياب `migration_lock.toml` في المستودع بعد Phase 4.6 (`resolve` لم ينشئه تلقائيًا) — راقبه عند أول `migrate dev` لاحقًا؛ لا تنشئه يدويًا.
6. عدم أخذ backup قبل أي أمر يكتب على `_prisma_migrations` أو يطبّق SQL على الإنتاج.
7. Development صارت aligned؛ الإنتاج ما زال يحتاج baseline منفصل (لا تنسخ أوامر resolve الخاصة بـ 004 من Dev إلى Prod).
