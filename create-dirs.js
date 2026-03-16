const fs = require('fs');
const path = require('path');

// Create directories
const dirs = [
  'prisma/migrations/20260316151800_add_integrations',
  'src/inngest',
  'src/inngest/functions',
  'src/app/api/auth/google',
  'src/app/api/auth/google/callback',
  'src/app/api/inngest',
];

console.log('Creating directories...');
for (const dir of dirs) {
  const fullPath = path.join(__dirname, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log('✓ Created: ' + dir);
}

// Create files with content
const files = {
  // Migration SQL
  'prisma/migrations/20260316151800_add_integrations/migration.sql': `-- AlterTable: Add Google Calendar OAuth fields to Recruiter
ALTER TABLE "Recruiter" ADD COLUMN "googleAccessToken" TEXT;
ALTER TABLE "Recruiter" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "Recruiter" ADD COLUMN "googleTokenExpiry" TIMESTAMP(3);
ALTER TABLE "Recruiter" ADD COLUMN "calendarConnected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Recruiter" ADD COLUMN "reminderTiming" INTEGER NOT NULL DEFAULT 60;

-- AlterTable: Add calendar and reminder fields to Round
ALTER TABLE "Round" ADD COLUMN "googleCalendarEventId" TEXT;
ALTER TABLE "Round" ADD COLUMN "adminCalendarEventId" TEXT;
ALTER TABLE "Round" ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Round" ADD COLUMN "reminderJobId" TEXT;
`,

  // Inngest client
  'src/inngest/client.ts': `import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({
  id: "tantech-ats",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event types for type safety
export type RoundReminderEvent = {
  name: "round/reminder.schedule";
  data: {
    roundId: string;
    recruiterId: string;
  };
};

export type Events = {
  "round/reminder.schedule": RoundReminderEvent;
};
`,

  // Round reminder function
  'src/inngest/functions/round-reminder.ts': `import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { notifyRoundReminder } from "@/lib/whatsapp";

export const sendRoundReminder = inngest.createFunction(
  { id: "send-round-reminder" },
  { event: "round/reminder.schedule" },
  async ({ event, step }) => {
    const { roundId, recruiterId } = event.data;

    // Step 1: Fetch round and related data
    const round = await step.run("fetch-round", async () => {
      return prisma.round.findUnique({
        where: { id: roundId },
        include: {
          application: {
            include: {
              candidate: {
                include: {
                  recruiter: true,
                },
              },
            },
          },
        },
      });
    });

    if (!round) {
      return { success: false, reason: "Round not found" };
    }

    // Step 2: Check if round is still pending and reminder not sent
    if (round.roundStatus !== "PENDING" && round.roundStatus !== "RESCHEDULED") {
      return { success: false, reason: "Round is no longer pending" };
    }

    if (round.reminderSent) {
      return { success: false, reason: "Reminder already sent" };
    }

    // Step 3: Send WhatsApp notification
    await step.run("send-whatsapp", async () => {
      const candidate = round.application.candidate;
      const recruiter = candidate.recruiter;
      
      await notifyRoundReminder(
        {
          roundType: round.roundType,
          date: round.date,
          time: round.time,
          timezone: round.timezone,
          mode: round.mode,
          vcReceiver: round.vcReceiver,
          roundStatus: round.roundStatus,
        },
        { fullName: candidate.fullName },
        { jobTitle: round.application.jobTitle, company: round.application.company },
        { 
          name: recruiter.name, 
          phone: recruiter.phone,
          reminderTiming: recruiter.reminderTiming,
        }
      );
    });

    // Step 4: Mark reminder as sent
    await step.run("mark-sent", async () => {
      await prisma.round.update({
        where: { id: roundId },
        data: { reminderSent: true },
      });
    });

    return { success: true };
  }
);
`,

  // Inngest route handler
  'src/app/api/inngest/route.ts': `import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendRoundReminder } from "@/inngest/functions/round-reminder";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendRoundReminder],
});
`,

  // Google OAuth initiation route
  'src/app/api/auth/google/route.ts': `import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";
import { getCurrentSession } from "@/lib/auth";

/**
 * GET /api/auth/google
 * Redirects user to Google OAuth consent screen
 */
export async function GET() {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
    }

    // Use recruiter ID as state for security
    const state = session.user.id;
    const authUrl = getGoogleAuthUrl(state);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Google OAuth] Error generating auth URL:", error);
    return NextResponse.redirect(
      new URL("/settings?error=google_auth_failed", process.env.NEXTAUTH_URL)
    );
  }
}
`,

  // Google OAuth callback route
  'src/app/api/auth/google/callback/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback, exchanges code for tokens, saves to DB
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Handle OAuth errors
    if (error) {
      console.error("[Google OAuth] Error from Google:", error);
      return NextResponse.redirect(
        new URL("/settings?error=google_auth_denied", baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=google_auth_no_code", baseUrl)
      );
    }

    // Verify session and state match
    const session = await getCurrentSession();
    if (!session?.user?.id || session.user.id !== state) {
      return NextResponse.redirect(
        new URL("/settings?error=google_auth_invalid_state", baseUrl)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL("/settings?error=google_auth_no_token", baseUrl)
      );
    }

    // Save tokens to database
    await prisma.recruiter.update({
      where: { id: session.user.id },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        calendarConnected: true,
      },
    });

    console.log("[Google OAuth] Successfully connected calendar for user:", session.user.id);
    
    return NextResponse.redirect(
      new URL("/settings?success=google_calendar_connected", baseUrl)
    );
  } catch (error) {
    console.error("[Google OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=google_auth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }
}
`,
};

console.log('\\nCreating files...');
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('✓ Created: ' + filePath);
}

console.log('\\n✅ All directories and files created successfully!');
console.log('\\nNext steps:');
console.log('1. Run: npm install googleapis twilio inngest');
console.log('2. Add environment variables to .env.local');
console.log('3. Run: npm run dev');

