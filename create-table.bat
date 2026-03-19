@echo off
echo ============================================================
echo CREATING DATABASE TABLE FOR OptimizedResume
echo ============================================================
echo.

echo Running database migration...
echo This will create the OptimizedResume table in PostgreSQL
echo.

call npx prisma migrate dev --name add_optimized_resume_table

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Migration failed!
    echo.
    echo Possible issues:
    echo 1. Database is not running
    echo 2. DATABASE_URL in .env is incorrect
    echo 3. Migration already exists
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo SUCCESS! The OptimizedResume table has been created!
echo ============================================================
echo.
echo The dev server should still be running - just try again!
echo.
pause
