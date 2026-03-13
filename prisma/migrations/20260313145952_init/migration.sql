-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'RECRUITER');

-- CreateEnum
CREATE TYPE "public"."CandidateStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'PLACED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('APPLIED', 'INTERVIEW_SCHEDULED', 'FEEDBACK_RECEIVED', 'OFFER_EXTENDED', 'PLACED', 'REJECTED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."RoundStatus" AS ENUM ('PENDING', 'CLEARED', 'RESCHEDULED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Recruiter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'RECRUITER',
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "personalLinkedIn" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "resumeUrl" TEXT,
    "skills" TEXT[],
    "experienceYears" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "noticePeriod" TEXT NOT NULL,
    "expectedCTC" TEXT NOT NULL,
    "status" "public"."CandidateStatus" NOT NULL DEFAULT 'ACTIVE',
    "recruiterId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "techTags" TEXT[],
    "appliedDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round" (
    "id" TEXT NOT NULL,
    "roundType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "vcReceiver" TEXT NOT NULL,
    "frontend" BOOLEAN NOT NULL DEFAULT false,
    "lipsync" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "roundStatus" "public"."RoundStatus" NOT NULL DEFAULT 'PENDING',
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_email_key" ON "public"."Recruiter"("email");

-- CreateIndex
CREATE INDEX "Recruiter_role_idx" ON "public"."Recruiter"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "public"."Candidate"("email");

-- CreateIndex
CREATE INDEX "Candidate_recruiterId_idx" ON "public"."Candidate"("recruiterId");

-- CreateIndex
CREATE INDEX "Candidate_status_idx" ON "public"."Candidate"("status");

-- CreateIndex
CREATE INDEX "Application_candidateId_idx" ON "public"."Application"("candidateId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "public"."Application"("status");

-- CreateIndex
CREATE INDEX "Round_applicationId_idx" ON "public"."Round"("applicationId");

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round" ADD CONSTRAINT "Round_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
