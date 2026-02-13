# سكربت لحل مشاكل الصلاحيات في Windows
# يجب تشغيل هذا السكربت كمسؤول (Run as Administrator)

Write-Host "=== إصلاح مشاكل الصلاحيات لـ Next.js ===" -ForegroundColor Cyan

$projectPath = "F:\research-platform-uob"
$nodePath = "C:\Program Files\nodejs"

# التحقق من الصلاحيات
Write-Host "`n1. التحقق من الصلاحيات..." -ForegroundColor Yellow

# إيقاف جميع عمليات Node.js
Write-Host "`n2. إيقاف عمليات Node.js الجارية..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# حذف مجلد .next
Write-Host "`n3. حذف مجلد .next..." -ForegroundColor Yellow
if (Test-Path "$projectPath\.next") {
    Remove-Item "$projectPath\.next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ تم حذف مجلد .next" -ForegroundColor Green
} else {
    Write-Host "   ✓ مجلد .next غير موجود" -ForegroundColor Green
}

# إعطاء صلاحيات كاملة للمجلد
Write-Host "`n4. إعطاء صلاحيات كاملة لمجلد المشروع..." -ForegroundColor Yellow
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls "$projectPath" /grant "${currentUser}:(OI)(CI)F" /T 2>$null
Write-Host "   ✓ تم تحديث الصلاحيات" -ForegroundColor Green

# إعطاء صلاحيات لمجلد node_modules
if (Test-Path "$projectPath\node_modules") {
    Write-Host "`n5. إعطاء صلاحيات لمجلد node_modules..." -ForegroundColor Yellow
    icacls "$projectPath\node_modules" /grant "${currentUser}:(OI)(CI)F" /T 2>$null
    Write-Host "   ✓ تم تحديث الصلاحيات" -ForegroundColor Green
}

# إعطاء صلاحيات لمجلد Node.js
if (Test-Path $nodePath) {
    Write-Host "`n6. إعطاء صلاحيات لمجلد Node.js..." -ForegroundColor Yellow
    icacls "$nodePath" /grant "${currentUser}:(OI)(CI)F" /T 2>$null
    Write-Host "   ✓ تم تحديث الصلاحيات" -ForegroundColor Green
}

Write-Host "`n=== تم الانتهاء! ===" -ForegroundColor Cyan
Write-Host "`nالآن يمكنك تشغيل: npm run dev" -ForegroundColor Green
