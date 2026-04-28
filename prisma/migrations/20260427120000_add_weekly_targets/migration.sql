-- Additive migration: create weekly recruiter targets table.
CREATE TABLE "RecruiterWeeklyTarget" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "applicationTarget" INTEGER,
    "placementTarget" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterWeeklyTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecruiterWeeklyTarget_recruiterId_weekStartDate_key"
    ON "RecruiterWeeklyTarget"("recruiterId", "weekStartDate");

CREATE INDEX "RecruiterWeeklyTarget_year_weekNumber_idx"
    ON "RecruiterWeeklyTarget"("year", "weekNumber");

ALTER TABLE "RecruiterWeeklyTarget"
    ADD CONSTRAINT "RecruiterWeeklyTarget_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
