-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'FREELANCE', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "CandidateType" AS ENUM ('OPT', 'FULL_TIME', 'C2C');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "employmentType" "EmploymentType",
ADD COLUMN "workMode" "WorkMode",
ADD COLUMN "candidateType" "CandidateType";
