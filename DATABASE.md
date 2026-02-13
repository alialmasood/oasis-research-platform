# 🔌 دليل إعداد قاعدة البيانات

## معلومات الاتصال

- **Host**: localhost
- **Port**: 5443
- **Database**: research_platform
- **User**: research_app
- **Password**: BASbas@2026
- **Schema**: public

## متغيرات البيئة المطلوبة

في ملف `.env` يجب تضمين:

```env
DATABASE_URL="postgresql://research_app:BASbas@2026@localhost:5443/research_platform?schema=public"
DB_HOST=localhost
DB_PORT=5443
DB_NAME=research_platform
DB_USER=research_app
DB_PASSWORD=BASbas@2026
```

راجع ملف `ENV_TEMPLATE.md` للتفاصيل الكاملة.

## إعداد الصلاحيات

المستخدم `research_app` موجود مسبقاً في Docker. بعد تشغيل قاعدة البيانات، يجب إعداد الصلاحيات:

### الطريقة 1: استخدام السكربت (موصى به)

**على Windows (PowerShell):**
```powershell
npm run db:setup-permissions
```

أو مباشرة:
```powershell
.\scripts\setup-db-permissions.ps1
```

**على Linux/Mac:**
```bash
chmod +x scripts/setup-db-permissions.sh
./scripts/setup-db-permissions.sh
```

### الطريقة 2: يدوياً باستخدام psql

```bash
psql -h localhost -p 5443 -U postgres -d research_platform -f prisma/init-db.sql
```

عند المطالبة بكلمة المرور، استخدم: `BASbas@2026`

### الطريقة 3: تنفيذ SQL مباشرة

اتصل بقاعدة البيانات:
```bash
psql -h localhost -p 5443 -U postgres -d research_platform
```

ثم نفّذ:
```sql
ALTER SCHEMA public OWNER TO research_app;
GRANT ALL ON SCHEMA public TO research_app;
GRANT ALL ON SCHEMA public TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO research_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO research_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO research_app;
GRANT USAGE ON SCHEMA public TO research_app;
GRANT CREATE ON SCHEMA public TO research_app;
```

## التحقق من الصلاحيات

للتحقق من أن الصلاحيات تم إعدادها بشكل صحيح:

```sql
-- التحقق من مالك schema
SELECT schema_name, schema_owner 
FROM information_schema.schemata 
WHERE schema_name = 'public';

-- التحقق من الصلاحيات
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND grantee = 'research_app';
```

## استكشاف الأخطاء

### خطأ: "permission denied for schema public"

هذا يعني أن الصلاحيات لم يتم إعدادها بعد. قم بتشغيل سكربت إعداد الصلاحيات.

### خطأ: "role research_app does not exist"

تأكد من أن المستخدم `research_app` موجود في قاعدة البيانات:
```sql
SELECT * FROM pg_user WHERE usename = 'research_app';
```

إذا لم يكن موجوداً، قم بإنشائه:
```sql
CREATE USER research_app WITH PASSWORD 'BASbas@2026';
GRANT ALL PRIVILEGES ON DATABASE research_platform TO research_app;
```

### خطأ في الاتصال

تأكد من:
1. أن Docker container يعمل: `docker-compose ps`
2. أن المنفذ 5443 متاح
3. أن كلمة المرور صحيحة
