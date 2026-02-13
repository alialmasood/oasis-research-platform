#!/bin/bash

# Script to set up database permissions for research_app user
# This script connects as postgres superuser and grants permissions to research_app

echo "🔧 إعداد صلاحيات قاعدة البيانات للمستخدم research_app..."

PGPASSWORD="BASbas@2026" psql -h localhost -p 5443 -U postgres -d research_platform -f prisma/init-db.sql

if [ $? -eq 0 ]; then
    echo "✅ تم إعداد الصلاحيات بنجاح!"
else
    echo "❌ حدث خطأ أثناء إعداد الصلاحيات"
    exit 1
fi
