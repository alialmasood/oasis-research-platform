# PowerShell script to set up database permissions for research_app user
# This script connects as postgres superuser and grants permissions to research_app

Write-Host "Setting up database permissions..." -ForegroundColor Cyan

$env:PGPASSWORD = "BASbas@2026"
psql -h localhost -p 5443 -U postgres -d research_platform -f prisma/init-db.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database permissions setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Error occurred while setting up database permissions" -ForegroundColor Red
    exit 1
}
