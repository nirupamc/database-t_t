@echo off
REM Kill all Node processes
echo Killing Node processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.cmd >nul 2>&1
echo Waiting 3 seconds...
timeout /t 3 /nobreak

REM Delete Prisma cache and lock files
echo Removing Prisma cache...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma" >nul 2>&1
)

REM Delete node_modules entirely and reinstall
echo Removing node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules" >nul 2>&1
)

echo Installing dependencies...
call npm install

echo Done! Now run: npm run dev
pause
