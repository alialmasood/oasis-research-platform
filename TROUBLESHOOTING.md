# 🔧 دليل حل المشاكل

## مشكلة: خطأ `EPERM` عند تشغيل `npm run dev`

### الأعراض:
```
Error: spawn EPERM
    at ChildProcess.spawn
errno: -4048,
code: 'EPERM',
syscall: 'spawn'
```

### الأسباب المحتملة:
1. **Windows Defender** أو برنامج مكافحة الفيروسات يمنع تشغيل العمليات
2. مشكلة في الصلاحيات على مجلد المشروع
3. عمليات Node.js عالقة تمنع الوصول للملفات

### الحلول:

#### الحل 1: تشغيل PowerShell كمسؤول وإصلاح الصلاحيات

1. افتح PowerShell **كمسؤول** (Run as Administrator)
2. انتقل إلى مجلد المشروع:
   ```powershell
   cd F:\research-platform-uob
   ```
3. شغّل سكربت الإصلاح:
   ```powershell
   .\scripts\fix-permissions.ps1
   ```
4. شغّل المشروع:
   ```powershell
   npm run dev
   ```

#### الحل 2: إضافة استثناءات في Windows Defender

1. افتح **Windows Security** (Windows Defender)
2. اذهب إلى **Virus & threat protection**
3. اختر **Manage settings** تحت **Virus & threat protection settings**
4. اذهب إلى **Exclusions** → **Add or remove exclusions**
5. أضف استثناءات للمجلدات التالية:
   - `F:\research-platform-uob`
   - `C:\Program Files\nodejs`
   - `%USERPROFILE%\.npm`
   - `%APPDATA%\npm`

#### الحل 3: إيقاف العمليات العالقة يدوياً

```powershell
# إيقاف جميع عمليات Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# حذف مجلد .next
Remove-Item .next -Recurse -Force

# إعادة تشغيل المشروع
npm run dev
```

#### الحل 4: التحقق من إعدادات Windows Defender

1. افتح **Windows Security**
2. اذهب إلى **App & browser control**
3. تأكد من أن **Check apps and files** مضبوط على **Warn** وليس **Block**

#### الحل 5: إعادة تثبيت Node.js

إذا استمرت المشكلة، قد تحتاج إلى:
1. إلغاء تثبيت Node.js
2. إعادة تثبيته من الموقع الرسمي: https://nodejs.org
3. تأكد من تثبيت النسخة LTS

### ملاحظات إضافية:

- تأكد من أنك تستخدم PowerShell أو Command Prompt كمسؤول
- قد تحتاج إلى إعادة تشغيل الكمبيوتر بعد تغيير إعدادات Windows Defender
- إذا كنت تستخدم برنامج مكافحة فيروس آخر (مثل Avast، Kaspersky)، أضف نفس الاستثناءات هناك

---

## مشكلة: خطأ `Access is denied` عند حذف مجلد `.next`

### الحل:
```powershell
# إيقاف جميع عمليات Node.js أولاً
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# ثم حذف المجلد
Remove-Item .next -Recurse -Force
```

---

## مشكلة: المنفذ 3000 مستخدم بالفعل

### الحل:
```powershell
# إيجاد العملية التي تستخدم المنفذ 3000
netstat -ano | findstr :3000

# إيقاف العملية (استبدل PID برقم العملية)
taskkill /PID <PID> /F

# أو استخدم المنفذ البديل 3001
npm run dev -- -p 3001
```

---

## مشكلة: خطأ في قاعدة البيانات

### التحقق من حالة Docker:
```powershell
docker-compose ps
```

### إعادة تشغيل قاعدة البيانات:
```powershell
docker-compose down
docker-compose up -d
```

### التحقق من الاتصال:
```powershell
npm run db:studio
```
