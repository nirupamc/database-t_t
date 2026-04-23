-- Align schema with existing database drift
ALTER TABLE "public"."Recruiter" ADD COLUMN IF NOT EXISTS "submissionTarget" INTEGER;
ALTER TABLE "public"."Recruiter" ADD COLUMN IF NOT EXISTS "placementTarget" INTEGER;
ALTER TABLE "public"."Application" ADD COLUMN IF NOT EXISTS "submittedBy" TEXT;
ALTER TABLE "public"."Application" ADD COLUMN IF NOT EXISTS "submittedByName" TEXT;

-- Create recruiter targets table
CREATE TABLE IF NOT EXISTS "public"."RecruiterTarget" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "applicationTarget" INTEGER NOT NULL DEFAULT 0,
    "placementTarget" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecruiterTarget_recruiterId_month_year_key" ON "public"."RecruiterTarget"("recruiterId", "month", "year");
CREATE INDEX IF NOT EXISTS "RecruiterTarget_recruiterId_idx" ON "public"."RecruiterTarget"("recruiterId");

ALTER TABLE "public"."RecruiterTarget" ADD CONSTRAINT "RecruiterTarget_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;