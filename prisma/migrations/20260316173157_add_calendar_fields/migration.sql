-- AlterTable
ALTER TABLE "public"."Recruiter" ADD COLUMN     "calendarConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "reminderTiming" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "public"."Round" ADD COLUMN     "adminCalendarEventId" TEXT,
ADD COLUMN     "googleCalendarEventId" TEXT,
ADD COLUMN     "reminderJobId" TEXT,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;
