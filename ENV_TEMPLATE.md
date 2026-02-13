# 📝 قالب ملف البيئة (.env)

هذا الملف **إجباري** ويجب وضعه في جذر المشروع باسم `.env`.

## تفاصيل قاعدة البيانات

```env
# ============================================
# قاعدة البيانات (Database Configuration)
# ============================================

# رابط الاتصال الكامل بقاعدة البيانات (للـ Prisma)
DATABASE_URL="postgresql://research_app:BASbas@2026@localhost:5443/research_platform?schema=public"

# تفاصيل قاعدة البيانات (منفصلة للاستخدام في الكود)
DB_HOST=localhost
DB_PORT=5443
DB_NAME=research_platform
DB_USER=research_app
DB_PASSWORD=BASbas@2026
```

## NextAuth Configuration

```env
# ============================================
# NextAuth Configuration
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

**ملاحظة مهمة**: يجب تغيير `NEXTAUTH_SECRET` في بيئة الإنتاج. يمكنك إنشاء secret عشوائي باستخدام:

```bash
openssl rand -base64 32
```

## بيئة التطبيق

```env
# ============================================
# بيئة التطبيق (App Environment)
# ============================================
NODE_ENV="development"
```

## ملف .env كامل

```env
# ============================================
# قاعدة البيانات (Database Configuration)
# ============================================
DATABASE_URL="postgresql://research_app:BASbas@2026@localhost:5443/research_platform?schema=public"
DB_HOST=localhost
DB_PORT=5443
DB_NAME=research_platform
DB_USER=research_app
DB_PASSWORD=BASbas@2026

# ============================================
# NextAuth Configuration
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# ============================================
# بيئة التطبيق (App Environment)
# ============================================
NODE_ENV="development"
```

## 📌 ملاحظات مهمة

1. **لا ترفع ملف `.env` إلى Git** - تم إضافته إلى `.gitignore`
2. **استخدم `.env.example` كقالب** - انسخه إلى `.env` وعدّل القيم
3. **في الإنتاج**: غيّر جميع القيم الحساسة (كلمات المرور، secrets)
4. **DATABASE_URL**: يستخدمه Prisma للاتصال بقاعدة البيانات
5. **DB_***: متغيرات منفصلة يمكن استخدامها في الكود مباشرة

## 🔐 معلومات قاعدة البيانات

- **Host**: localhost
- **Port**: 5443
- **Database**: research_platform
- **User**: research_app
- **Password**: BASbas@2026
- **Schema**: public
