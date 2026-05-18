@echo off
REM ========================================
REM Aggressive Prisma Cache Cleanup
REM ========================================

echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.cmd 2>nul
taskkill /F /IM npx.cmd 2>nul
echo Waiting 5 seconds...
timeout /t 5 /nobreak

echo.
echo Removing Prisma engine files...
cd /d "D:\tantech\Tantech database ui"

REM Delete the entire .prisma folder
if exist "node_modules\.prisma" (
    echo Deleting node_modules\.prisma...
    rmdir /s /q "node_modules\.prisma" 2>nul
)

REM Delete entire node_modules
if exist "node_modules" (
    echo Deleting node_modules...
    rmdir /s /q "node_modules" 2>nul
)

echo.
echo Clearing npm cache...
call npm cache clean --force

echo.
echo Reinstalling dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Dependencies reinstalled.
    echo.
    echo Now run: npm run dev
) else (
    echo.
    echo FAILED! Try running as Administrator.
)

pause
