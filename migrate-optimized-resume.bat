@echo off
echo Running Prisma migration for OptimizedResume model...
echo.

npx prisma generate
echo.

npx prisma migrate dev --name add_optimized_resume_fields
echo.

echo Migration complete!
pause
