@echo off
REM ========================================
REM FINAL FIX - Complete Cleanup + Restart
REM ========================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo STEP 1: Kill all Node processes
echo ========================================
taskkill /F /IM node.exe 2>nul >nul
taskkill /F /IM npm.cmd 2>nul >nul
taskkill /F /IM npx.cmd 2>nul >nul
echo Done. Waiting 5 seconds...
timeout /t 5 /nobreak

echo.
echo ========================================
echo STEP 2: Remove Prisma lock files
echo ========================================
cd /d "D:\tantech\Tantech database ui"

if exist "node_modules\.prisma\client\query_engine-windows.dll.node" (
    del "node_modules\.prisma\client\query_engine-windows.dll.node" 2>nul >nul
    echo Removed query_engine-windows.dll.node
)

for /r "node_modules\.prisma\client" %%F in (*.tmp*) do (
    del "%%F" 2>nul >nul
)
echo Removed all .tmp files

echo.
echo ========================================
echo STEP 3: Start dev server
echo ========================================
echo.
call npm run dev

