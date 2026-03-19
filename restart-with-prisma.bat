@echo off
echo ============================================================
echo FIXING PRISMA CLIENT - Resume Studio
echo ============================================================
echo.

echo Step 1: Killing any running Node/Next.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo Step 2: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo.

echo Step 3: Running database migration...
call npx prisma migrate dev --name add_optimized_resume_fields
if %errorlevel% neq 0 (
    echo ERROR: Failed to run migration
    pause
    exit /b 1
)
echo.

echo ============================================================
echo SUCCESS! Now run: npm run dev
echo ============================================================
pause
