# حل مشكلة ChunkLoadError

## المشكلة:
```
Loading chunk app/researcher/academic-cv/page failed.
(missing: http://localhost:3000/_next/static/chunks/app/researcher/academic-cv/page.js)
```

## الحلول:

### الحل 1: حذف مجلد .next وإعادة التشغيل (الأسرع)

```powershell
# إيقاف جميع عمليات Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# حذف مجلد .next
cd F:\research-platform-uob
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue

# إعادة تشغيل المشروع
npm run dev
```

### الحل 2: تنظيف Cache الكامل

```powershell
# حذف جميع ملفات cache
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue

# إعادة تثبيت المكتبات (اختياري)
npm install

# إعادة تشغيل
npm run dev
```

### الحل 3: إعادة تشغيل المتصفح

1. اضغط `Ctrl + Shift + R` (Hard Refresh)
2. أو امسح cache المتصفح
3. أو افتح في نافذة Incognito/Private

### الحل 4: التحقق من المنفذ

```powershell
# تحقق من المنفذ المستخدم
netstat -ano | findstr :3000

# إذا كان مستخدم، أوقف العملية
taskkill /PID <PID> /F
```

## ملاحظات:

- هذا الخطأ عادة يحدث بعد تغييرات كبيرة في الكود
- Next.js يحتاج إلى rebuild كامل أحياناً
- تأكد من إيقاف جميع عمليات Node.js قبل حذف .next
