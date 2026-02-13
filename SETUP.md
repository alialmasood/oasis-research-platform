# 🚀 دليل التأسيس السريع

## الخطوات الأساسية

### 1️⃣ تثبيت المكتبات
```bash
npm install
```

### 2️⃣ إعداد ملف البيئة
```bash
# انسخ ملف .env.example إلى .env
# ثم عدّل القيم حسب الحاجة
```

**ملاحظة**: تأكد من أن ملف `.env` يحتوي على:

```env
DATABASE_URL="postgresql://research_app:BASbas@2026@localhost:5443/research_platform?schema=public"
DB_HOST=localhost
DB_PORT=5443
DB_NAME=research_platform
DB_USER=research_app
DB_PASSWORD=BASbas@2026
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NODE_ENV="development"
```

راجع ملف `ENV_TEMPLATE.md` للتفاصيل الكاملة.

### 3️⃣ تشغيل قاعدة البيانات
```bash
docker-compose up -d
```

### 4️⃣ إعداد صلاحيات قاعدة البيانات

**على Windows (PowerShell):**
```powershell
.\scripts\setup-db-permissions.ps1
```

**على Linux/Mac:**
```bash
chmod +x scripts/setup-db-permissions.sh
./scripts/setup-db-permissions.sh
```

### 5️⃣ إعداد قاعدة البيانات
```bash
npm run db:generate
npm run db:push
npm run db:setup-functions
npm run db:seed
```

### 6️⃣ تشغيل المشروع
```bash
npm run dev
```

## 🔑 بيانات تسجيل الدخول التجريبية

### المدير:
- **البريد**: admin@uobasrah.edu.iq
- **كلمة المرور**: admin123

### الباحث:
- **البريد**: researcher@uobasrah.edu.iq
- **كلمة المرور**: researcher123

## 🌐 الروابط

- **التطبيق**: http://localhost:3000

## 🔌 معلومات قاعدة البيانات

- **Host**: localhost
- **Port**: 5443
- **Database**: research_platform
- **User**: research_app
- **Password**: BASbas@2026

## 📝 ملاحظات مهمة

1. تأكد من تشغيل Docker قبل تشغيل قاعدة البيانات
2. تأكد من وجود ملف `.env` قبل تشغيل Prisma
3. استخدم `npm run db:seed` لإضافة بيانات تجريبية
4. جميع الصفحات محمية وتتطلب تسجيل الدخول

## 🛠️ أوامر مفيدة

```bash
# إعادة تشغيل قاعدة البيانات
docker-compose restart

# إيقاف قاعدة البيانات
docker-compose down

# عرض سجلات قاعدة البيانات
docker-compose logs research_platform_postgres

# فتح Prisma Studio
npm run db:studio
```
