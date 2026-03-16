import { google, calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";

// Types for better type safety
type RecruiterWithTokens = {
  id: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
  calendarConnected: boolean;
};

type RoundData = {
  id: string;
  roundType: string;
  date: Date;
  time: string;
  timezone: string;
  duration: string;
  mode: string;
  vcReceiver: string;
};

type CandidateData = {
  fullName: string;
  personalLinkedIn: string;
};

type ApplicationData = {
  jobTitle: string;
  company: string;
};

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes needed for calendar access
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Generate Google OAuth consent URL
 */
export function getGoogleAuthUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_CALENDAR_SCOPES,
    state,
    prompt: "consent", // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get OAuth2 client with stored tokens, auto-refreshes if expired
 */
export async function getOAuthClient(recruiter: RecruiterWithTokens) {
  if (!recruiter.googleAccessToken || !recruiter.googleRefreshToken) {
    throw new Error("Recruiter has not connected Google Calendar");
  }

  oauth2Client.setCredentials({
    access_token: recruiter.googleAccessToken,
    refresh_token: recruiter.googleRefreshToken,
    expiry_date: recruiter.googleTokenExpiry?.getTime(),
  });

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  const expiryDate = recruiter.googleTokenExpiry?.getTime() ?? 0;
  const isExpired = expiryDate - now < 5 * 60 * 1000;

  if (isExpired) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Save new tokens to database
      await prisma.recruiter.update({
        where: { id: recruiter.id },
        data: {
          googleAccessToken: credentials.access_token ?? recruiter.googleAccessToken,
          googleTokenExpiry: credentials.expiry_date 
            ? new Date(credentials.expiry_date) 
            : recruiter.googleTokenExpiry,
        },
      });

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("[Google Calendar] Token refresh failed:", error);
      // Mark calendar as disconnected if refresh fails
      await prisma.recruiter.update({
        where: { id: recruiter.id },
        data: { calendarConnected: false },
      });
      throw new Error("Google Calendar token expired. Please reconnect.");
    }
  }

  return oauth2Client;
}

/**
 * Parse duration string (e.g., "30 mins", "1 hour") to minutes
 */
function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(min|hour|hr)/i);
  if (!match) return 60; // Default to 60 minutes
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  if (unit.startsWith("hour") || unit === "hr") {
    return value * 60;
  }
  return value;
}

/**
 * Build event datetime from round date, time, and timezone
 */
function buildEventDateTimes(round: RoundData): { start: calendar_v3.Schema$EventDateTime; end: calendar_v3.Schema$EventDateTime } {
  // Combine date and time into ISO format
  const dateStr = round.date.toISOString().split("T")[0];
  const timeStr = round.time.padStart(5, "0"); // Ensure HH:MM format
  
  const durationMinutes = parseDuration(round.duration);
  
  const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  // Map common timezone abbreviations to IANA timezones
  const tzMap: Record<string, string> = {
    "IST": "Asia/Kolkata",
    "EST": "America/New_York",
    "CST": "America/Chicago",
    "PST": "America/Los_Angeles",
    "GMT": "Etc/GMT",
    "CET": "Europe/Paris",
    "JST": "Asia/Tokyo",
    "AEST": "Australia/Sydney",
  };

  const timeZone = tzMap[round.timezone.toUpperCase()] || round.timezone;

  return {
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone,
    },
  };
}

/**
 * Build calendar event body
 */
function buildEventBody(
  round: RoundData,
  candidate: CandidateData,
  application: ApplicationData,
  recruiterName?: string
): calendar_v3.Schema$Event {
  const { start, end } = buildEventDateTimes(round);
  
  const description = [
    `📋 Round Type: ${round.roundType}`,
    `🎯 Mode: ${round.mode}`,
    round.vcReceiver ? `🔗 VC Link/Receiver: ${round.vcReceiver}` : null,
    `👤 Candidate LinkedIn: ${candidate.personalLinkedIn}`,
    recruiterName ? `👨‍💼 Recruiter: ${recruiterName}` : null,
    "",
    "— Tantech ATS",
  ].filter(Boolean).join("\n");

  return {
    summary: `[Interview] ${candidate.fullName} - ${application.jobTitle} at ${application.company}`,
    description,
    start,
    end,
    location: round.vcReceiver || undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "popup", minutes: 10 },
      ],
    },
  };
}

/**
 * Create calendar event on recruiter's personal calendar
 */
export async function createCalendarEvent(
  recruiter: RecruiterWithTokens & { name?: string },
  round: RoundData,
  candidate: CandidateData,
  application: ApplicationData
): Promise<string | null> {
  try {
    if (!recruiter.calendarConnected) {
      console.log("[Google Calendar] Recruiter calendar not connected, skipping");
      return null;
    }

    const auth = await getOAuthClient(recruiter);
    const calendar = google.calendar({ version: "v3", auth });
    
    const event = buildEventBody(round, candidate, application, recruiter.name);
    
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    console.log("[Google Calendar] Created event:", response.data.id);
    return response.data.id ?? null;
  } catch (error) {
    console.error("[Google Calendar] Failed to create event:", error);
    return null;
  }
}

/**
 * Create event on shared Tantech calendar (for admin visibility)
 */
export async function createSharedCalendarEvent(
  round: RoundData,
  candidate: CandidateData,
  application: ApplicationData,
  recruiterName: string
): Promise<string | null> {
  try {
    const sharedCalendarId = process.env.GOOGLE_SHARED_CALENDAR_ID;
    if (!sharedCalendarId) {
      console.log("[Google Calendar] No shared calendar ID configured, skipping");
      return null;
    }

    // Use service account or admin credentials for shared calendar
    // For now, we'll skip if no shared calendar is configured
    // In production, you'd use a service account here
    
    // Placeholder: would need service account setup
    console.log("[Google Calendar] Shared calendar event creation would go here");
    return null;
  } catch (error) {
    console.error("[Google Calendar] Failed to create shared event:", error);
    return null;
  }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(
  recruiter: RecruiterWithTokens,
  eventId: string,
  round: RoundData,
  candidate: CandidateData,
  application: ApplicationData
): Promise<boolean> {
  try {
    if (!recruiter.calendarConnected || !eventId) {
      return false;
    }

    const auth = await getOAuthClient(recruiter);
    const calendar = google.calendar({ version: "v3", auth });
    
    const event = buildEventBody(round, candidate, application);
    
    await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: event,
    });

    console.log("[Google Calendar] Updated event:", eventId);
    return true;
  } catch (error) {
    console.error("[Google Calendar] Failed to update event:", error);
    return false;
  }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(
  recruiter: RecruiterWithTokens,
  eventId: string
): Promise<boolean> {
  try {
    if (!recruiter.calendarConnected || !eventId) {
      return false;
    }

    const auth = await getOAuthClient(recruiter);
    const calendar = google.calendar({ version: "v3", auth });
    
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    console.log("[Google Calendar] Deleted event:", eventId);
    return true;
  } catch (error) {
    console.error("[Google Calendar] Failed to delete event:", error);
    return false;
  }
}

/**
 * Disconnect Google Calendar (revoke tokens)
 */
export async function disconnectGoogleCalendar(recruiterId: string): Promise<void> {
  const recruiter = await prisma.recruiter.findUnique({
    where: { id: recruiterId },
    select: { googleAccessToken: true, googleRefreshToken: true },
  });

  if (recruiter?.googleAccessToken) {
    try {
      oauth2Client.setCredentials({
        access_token: recruiter.googleAccessToken,
        refresh_token: recruiter.googleRefreshToken,
      });
      await oauth2Client.revokeCredentials();
    } catch (error) {
      console.error("[Google Calendar] Failed to revoke credentials:", error);
    }
  }

  await prisma.recruiter.update({
    where: { id: recruiterId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      calendarConnected: false,
    },
  });
}
