-- CreateEnum
CREATE TYPE "public"."OptimizedResumeStatus" AS ENUM ('SCORED', 'OPTIMIZED');

-- CreateTable
CREATE TABLE "public"."OptimizedResume" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT,
    "jobDescription" TEXT NOT NULL,
    "originalResumeUrl" TEXT NOT NULL,
    "optimizedResumeUrl" TEXT,
    "compatibilityScore" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "fitIndicator" TEXT NOT NULL,
    "suggestions" TEXT[],
    "status" "public"."OptimizedResumeStatus" NOT NULL DEFAULT 'SCORED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizedResume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptimizedResume_candidateId_idx" ON "public"."OptimizedResume"("candidateId");

-- CreateIndex
CREATE INDEX "OptimizedResume_recruiterId_idx" ON "public"."OptimizedResume"("recruiterId");

-- AddForeignKey
ALTER TABLE "public"."OptimizedResume" ADD CONSTRAINT "OptimizedResume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptimizedResume" ADD CONSTRAINT "OptimizedResume_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."Recruiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
