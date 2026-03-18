@echo off
echo Running TypeScript type checker...
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo.
    echo TypeScript check failed with errors above.
    exit /b 1
)
echo.
echo TypeScript check passed. Running build...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo Build failed with errors above.
    exit /b 1
)
echo.
echo All checks passed.
