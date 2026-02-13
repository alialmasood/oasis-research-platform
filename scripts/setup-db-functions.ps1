# PowerShell script to set up database functions
# This script creates the authentication functions in the database

Write-Host "Setting up database functions..." -ForegroundColor Cyan

$env:PGPASSWORD = "BASbas@2026"
psql -h localhost -p 5443 -U postgres -d research_platform -f prisma/migrations/001_init_db_functions.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database functions setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Error occurred while setting up database functions" -ForegroundColor Red
    exit 1
}
