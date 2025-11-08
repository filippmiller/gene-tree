# Delete user from Supabase via direct DB connection
# Requires psql to be installed: https://www.postgresql.org/download/

$email = "filippmiller@gmail.com"

# Get DB URL from Railway
$dbUrl = railway variables -k | Select-String "SUPABASE_DB_POOLER_URL" | ForEach-Object { $_ -replace "SUPABASE_DB_POOLER_URL=", "" }

if (!$dbUrl) {
    Write-Host "Error: Could not get database URL from Railway" -ForegroundColor Red
    exit 1
}

Write-Host "Deleting user: $email" -ForegroundColor Yellow

# Execute DELETE query
$query = "DELETE FROM auth.users WHERE email = '$email';"
$result = psql $dbUrl.Trim() -c $query

if ($LASTEXITCODE -eq 0) {
    Write-Host "User deleted successfully!" -ForegroundColor Green
} else {
    Write-Host "Error deleting user. Make sure psql is installed." -ForegroundColor Red
    Write-Host "Alternative: Run the SQL in Supabase Dashboard SQL Editor" -ForegroundColor Yellow
}
