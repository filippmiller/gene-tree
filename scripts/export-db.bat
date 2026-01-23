@echo off
set PGPASSWORD=nfTcN9BdAwl6TX8b
echo Starting database export...
pg_dump -h db.mbntpsfllwhlnzuzspvp.supabase.co -p 5432 -U postgres -d postgres --no-owner --no-acl -v -f migration-backup\database.sql 2>&1
echo Exit code: %ERRORLEVEL%
pause
