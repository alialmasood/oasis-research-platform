# 🗄️ بنية قاعدة البيانات

## نظرة عامة

قاعدة البيانات هي **المصدر الوحيد للحقيقة** للمصادقة والأدوار. جميع عمليات التحقق من كلمة المرور تتم داخل قاعدة البيانات باستخدام دوال PostgreSQL.

## الجداول الأساسية

### 1. users (المستخدمون)
- **password_hash**: يتم تخزين كلمة المرور المشفرة باستخدام bcrypt عبر pgcrypto
- **is_active**: حالة تفعيل المستخدم
- **department_id**: ربط بالمؤسسة/القسم

### 2. departments (الأقسام)
- تخزين معلومات الأقسام والكليات

### 3. roles (الأدوار)
- تخزين الأدوار المختلفة (مثل: ADMIN, RESEARCHER, MODERATOR)

### 4. permissions (الصلاحيات)
- تخزين الصلاحيات الفردية
- كل صلاحية لها: `resource` (مثل: users, publications) و `action` (مثل: create, read, update, delete)

### 5. user_roles (ربط المستخدمين بالأدوار)
- علاقة many-to-many بين المستخدمين والأدوار

### 6. role_permissions (ربط الأدوار بالصلاحيات)
- علاقة many-to-many بين الأدوار والصلاحيات

## الوحدات العلمية

### 1. publications (المنشورات)
- **status**: PUBLISHED, UNPUBLISHED, SUBMITTED, UNDER_REVIEW
- **category**: SCOPUS, Q1, Q2, Q3, Q4, OTHER
- **doi**: معرف DOI فريد

### 2. conferences (المؤتمرات)
- معلومات المؤتمرات والمشاركات

### 3. books (الكتب)
- معلومات الكتب المنشورة
- **isbn**: معرف ISBN فريد

### 4. activities (الأنشطة)
- **type**: COURSE, SEMINAR, WORKSHOP, TRAINING, OTHER
- دورات وندوات وورش عمل

### 5. positions (المناصب)
- المناصب الأكاديمية والإدارية
- **is_current**: هل المنصب الحالي

### 6. recognitions (التقديرات)
- **type**: COMMITTEE, VOLUNTEER, THANKS, SUPERVISION, AWARD, OTHER
- لجان، أعمال تطوعية، شكر، إشراف، جوائز

## المصادقة

### دوال قاعدة البيانات

#### 1. verify_login(username_or_email, password)
```sql
SELECT * FROM verify_login('admin', 'password123');
```

تقوم هذه الدالة بـ:
- البحث عن المستخدم بالبريد الإلكتروني أو اسم المستخدم
- التحقق من كلمة المرور باستخدام bcrypt
- إرجاع معلومات المستخدم إذا كانت صحيحة

#### 2. hash_password(password)
```sql
SELECT hash_password('password123');
```

تقوم بتشفير كلمة المرور باستخدام bcrypt مع salt rounds = 12.

### الأمان

- **لا يتم تخزين كلمات المرور كنص عادي** - جميعها مشفرة باستخدام bcrypt
- **التحقق يتم داخل قاعدة البيانات** - لا يتم إرسال كلمات المرور عبر الشبكة
- **استخدام pgcrypto** - extension PostgreSQL آمن ومثبت

## العلاقات

```
users → departments (many-to-one)
users → roles (many-to-many via user_roles)
roles → permissions (many-to-many via role_permissions)
users → publications (one-to-many)
users → conferences (one-to-many)
users → books (one-to-many)
users → activities (one-to-many)
users → positions (one-to-many)
users → recognitions (one-to-many)
```

## إعداد قاعدة البيانات

### 1. إنشاء الجداول
```bash
npm run db:push
```

### 2. إعداد الدوال
```bash
npm run db:setup-functions
```

أو يدوياً:
```bash
psql -h localhost -p 5443 -U postgres -d research_platform -f prisma/migrations/001_init_db_functions.sql
```

### 3. إضافة البيانات التجريبية
```bash
npm run db:seed
```

## استخدام الدوال في الكود

### تسجيل الدخول
```typescript
import { loginUser } from "@/lib/auth";

const result = await loginUser("admin", "password123");
// أو
const result = await loginUser("admin@example.com", "password123");
```

### الحصول على الأدوار والصلاحيات
```typescript
import { getUserRoles, getUserPermissions } from "@/lib/auth";

const roles = await getUserRoles(userId);
const permissions = await getUserPermissions(userId);
```

### التحقق من الصلاحيات
```typescript
import { requirePermission } from "@/lib/middleware";

export const GET = requirePermission(
  "publications.create",
  async (request, user) => {
    // User has permission
  }
);
```

## ملاحظات مهمة

1. **قاعدة البيانات هي المصدر الوحيد للحقيقة** - لا يتم تخزين معلومات المصادقة في مكان آخر
2. **استخدام pgcrypto** - جميع عمليات التشفير تتم داخل قاعدة البيانات
3. **نظام أدوار مرن** - يمكن إضافة أدوار وصلاحيات جديدة بسهولة
4. **العلاقات محفوظة** - جميع العلاقات محفوظة في قاعدة البيانات
