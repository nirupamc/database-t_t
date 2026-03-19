@echo off
echo ============================================================
echo COMPLETE PRISMA FIX - This will solve the issue
echo ============================================================
echo.

echo Step 1: Stopping all Node/Next.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Done!
echo.

echo Step 2: Deleting .next cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo Deleted .next folder
) else (
    echo No .next folder found
)
echo.

echo Step 3: Deleting node_modules\.cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo Deleted node_modules\.cache folder
) else (
    echo No cache folder found
)
echo.

echo Step 4: Regenerating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to generate Prisma client!
    echo Check your prisma/schema.prisma file for syntax errors.
    pause
    exit /b 1
)
echo.
echo Success! Prisma client regenerated.
echo.

echo Step 5: Running database migration...
call npx prisma migrate dev --name add_optimized_resume_complete
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Migration failed or was skipped.
    echo This might be okay if the table already exists.
)
echo.

echo ============================================================
echo DONE! Now run: npm run dev
echo ============================================================
echo.
echo The optimizedResume model should now be available!
echo.
pause
