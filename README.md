# منصة البحث العلمي - جامعة البصرة

منصة بحثية شاملة لإدارة الأنشطة البحثية والأكاديمية لجامعة البصرة.

## 🚀 المميزات

- ✅ Next.js 16 مع App Router و TypeScript
- ✅ Tailwind CSS + shadcn/ui + lucide-react + recharts
- ✅ دعم RTL كامل مع خط Cairo العربي
- ✅ Prisma + PostgreSQL
- ✅ نظام مصادقة آمن (JWT Sessions)
- ✅ نظام أدوار: ADMIN و RESEARCHER
- ✅ واجهة داشبورد حديثة مع Sidebar + Header + Charts

## 📋 المتطلبات

- Node.js 18+ 
- Docker و Docker Compose
- npm أو yarn

## 🛠️ خطوات التأسيس

### 1. تثبيت المكتبات

```bash
npm install
```

### 2. إعداد قاعدة البيانات

قم بإنشاء ملف `.env` في جذر المشروع:

```bash
cp .env.example .env
```

ثم عدّل ملف `.env` وأضف:

```env
# قاعدة البيانات
DATABASE_URL="postgresql://research_app:BASbas@2026@localhost:5443/research_platform?schema=public"
DB_HOST=localhost
DB_PORT=5443
DB_NAME=research_platform
DB_USER=research_app
DB_PASSWORD=BASbas@2026

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# بيئة التطبيق
NODE_ENV="development"
```

### 3. تشغيل قاعدة البيانات

```bash
docker-compose up -d
```

هذا الأمر سيشغل:
- PostgreSQL على المنفذ `5443`

**ملاحظة**: المستخدم `research_app` موجود مسبقاً في Docker. تأكد من أن الصلاحيات صحيحة.

### 4. إعداد صلاحيات قاعدة البيانات

بعد تشغيل قاعدة البيانات، قم بتشغيل سكربت إعداد الصلاحيات:

**على Windows (PowerShell):**
```powershell
npm run db:setup-permissions
```

**على Linux/Mac:**
```bash
chmod +x scripts/setup-db-permissions.sh
./scripts/setup-db-permissions.sh
```

أو يدوياً باستخدام psql:
```bash
psql -h localhost -p 5443 -U postgres -d research_platform -f prisma/init-db.sql
```

### 5. إعداد Prisma

```bash
# توليد Prisma Client
npm run db:generate

# إنشاء الجداول في قاعدة البيانات
npm run db:push

# إعداد دوال قاعدة البيانات (للمصادقة)
npm run db:setup-functions
```

### 6. إضافة بيانات تجريبية

```bash
npm run db:seed
```

سيتم إنشاء:
- مستخدم مدير: `admin@uobasrah.edu.iq` / `admin123`
- مستخدم باحث: `researcher@uobasrah.edu.iq` / `researcher123`

### 7. تشغيل المشروع

```bash
npm run dev
```

افتح المتصفح على: http://localhost:3000

## 📁 هيكل المشروع

```
research-platform-uob/
├── app/                    # صفحات Next.js App Router
│   ├── api/               # API Routes
│   │   └── auth/         # مسارات المصادقة
│   ├── admin/            # صفحات المدير
│   ├── researcher/       # صفحات الباحث
│   └── login/            # صفحة تسجيل الدخول
├── components/            # مكونات React
│   ├── layout/           # Layout Components
│   └── ui/               # shadcn/ui Components
├── lib/                  # مكتبات مساعدة
│   ├── auth.ts           # نظام المصادقة
│   ├── db.ts             # Prisma Client
│   ├── middleware.ts     # Middleware للمصادقة
│   └── validations/      # Zod Schemas
├── prisma/               # Prisma Schema
│   ├── schema.prisma     # Schema قاعدة البيانات
│   └── seed.ts           # بيانات تجريبية
└── public/               # ملفات ثابتة
```

## 🔌 معلومات الاتصال بقاعدة البيانات

- **Host**: localhost
- **Port**: 5443
- **Database**: research_platform
- **User**: research_app
- **Password**: BASbas@2026
- **Schema**: public (owner: research_app)

## 🔐 نظام المصادقة

المشروع يستخدم JWT Sessions مع cookies آمنة. الأدوار المتاحة:

- **ADMIN**: وصول كامل لإدارة النظام
- **RESEARCHER**: وصول محدود لإدارة الأنشطة الشخصية

## 📊 قاعدة البيانات

### الجداول الرئيسية:

- **User**: المستخدمون (ADMIN / RESEARCHER)
- **ResearcherProfile**: الملف الشخصي للباحث
- **Activity**: الأنشطة البحثية (أوراق، مؤتمرات، ندوات، إلخ)
- **FileUpload**: الملفات المرفوعة

## 🎨 المكونات UI

المشروع يستخدم:
- **shadcn/ui**: مكونات UI جاهزة
- **lucide-react**: أيقونات
- **recharts**: رسوم بيانية

## 📝 الأوامر المتاحة

```bash
# التطوير
npm run dev              # تشغيل خادم التطوير

# قاعدة البيانات
npm run db:generate      # توليد Prisma Client
npm run db:push          # دفع Schema إلى قاعدة البيانات
npm run db:migrate       # إنشاء Migration جديد
npm run db:seed          # إضافة بيانات تجريبية
npm run db:studio        # فتح Prisma Studio

# الإنتاج
npm run build            # بناء المشروع
npm run start            # تشغيل الإنتاج
```

## 🔧 التطوير

### إضافة صفحة جديدة

1. أنشئ ملف في `app/[route]/page.tsx`
2. استخدم `getSessionUser()` للتحقق من المصادقة
3. استخدم `DashboardLayout` للصفحات المحمية

### إضافة API Route

1. أنشئ ملف في `app/api/[route]/route.ts`
2. استخدم Zod للتحقق من المدخلات
3. استخدم Prisma للوصول إلى قاعدة البيانات

## 🐳 Docker

لإيقاف قاعدة البيانات:

```bash
docker-compose down
```

لإزالة البيانات:

```bash
docker-compose down -v
```

## 📄 الترخيص

هذا المشروع مخصص لجامعة البصرة.

## 🤝 المساهمة

يرجى فتح Issue أو Pull Request للمساهمة في المشروع.

---

**تم التطوير بواسطة** - منصة البحث العلمي - جامعة البصرة
