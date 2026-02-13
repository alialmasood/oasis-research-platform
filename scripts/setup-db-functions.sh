#!/bin/bash

# Script to set up database functions
# This script creates the authentication functions in the database

echo "🔧 إعداد دوال قاعدة البيانات..."

PGPASSWORD="BASbas@2026" psql -h localhost -p 5443 -U postgres -d research_platform -f prisma/migrations/001_init_db_functions.sql

if [ $? -eq 0 ]; then
    echo "✅ تم إعداد الدوال بنجاح!"
else
    echo "❌ حدث خطأ أثناء إعداد الدوال"
    exit 1
fi
