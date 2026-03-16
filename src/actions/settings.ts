"use server";

import { revalidatePath } from "next/cache";

import { requireRecruiterOrAdmin } from "@/actions/_helpers";
import { prisma } from "@/lib/prisma";

// Valid reminder timing values
const VALID_REMINDER_TIMINGS = [15, 30, 60, 120, 1440] as const;

/**
 * Get recruiter's settings (excluding sensitive tokens)
 */
export async function getRecruiterSettingsAction() {
  const user = await requireRecruiterOrAdmin();
  
  const recruiter = await prisma.recruiter.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      calendarConnected: true,
      reminderTiming: true,
      googleTokenExpiry: true,
      // Explicitly exclude tokens - never send to client
      // googleAccessToken: false,
      // googleRefreshToken: false,
    },
  });

  if (!recruiter) {
    throw new Error("Recruiter not found");
  }

  return {
    id: recruiter.id,
    name: recruiter.name,
    email: recruiter.email,
    phone: recruiter.phone,
    calendarConnected: recruiter.calendarConnected,
    reminderTiming: recruiter.reminderTiming,
    googleTokenExpiry: recruiter.googleTokenExpiry,
  };
}

/**
 * Update recruiter's reminder timing preference
 */
export async function updateReminderTimingAction(minutes: number): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRecruiterOrAdmin();
    
    // Validate minutes is one of the allowed values
    if (!VALID_REMINDER_TIMINGS.includes(minutes as typeof VALID_REMINDER_TIMINGS[number])) {
      return { success: false, error: "Invalid timing value" };
    }

    await prisma.recruiter.update({
      where: { id: user.id },
      data: { reminderTiming: minutes },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("[Settings] Failed to update reminder timing:", error);
    return { success: false, error: "Failed to update reminder timing" };
  }
}

/**
 * Disconnect Google Calendar and revoke tokens
 */
export async function disconnectGoogleCalendarAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRecruiterOrAdmin();
    
    // Get current access token for revocation
    const recruiter = await prisma.recruiter.findUnique({
      where: { id: user.id },
      select: { googleAccessToken: true },
    });

    // Revoke token with Google (fire and forget)
    if (recruiter?.googleAccessToken) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${recruiter.googleAccessToken}`,
          { method: "POST" }
        );
      } catch (revokeError) {
        // Don't block on revoke failure - just log it
        console.warn("[Settings] Google token revocation failed:", revokeError);
      }
    }

    // Clear all Google-related fields
    await prisma.recruiter.update({
      where: { id: user.id },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        calendarConnected: false,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("[Settings] Failed to disconnect Google Calendar:", error);
    return { success: false, error: "Failed to disconnect Google Calendar" };
  }
}
