import Twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { 
  formatWhatsApp, 
  validateIndianMobile, 
  PhoneFormatError,
  formatPhoneDisplay,
} from "@/lib/phone-utils";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null;

// Types
type RoundData = {
  roundType: string;
  date: Date;
  time: string;
  timezone: string;
  duration: string;
  mode: string;
  vcReceiver: string;
  roundStatus: string;
};

type CandidateData = {
  fullName: string;
};

type ApplicationData = {
  jobTitle: string;
  company: string;
};

type RecruiterData = {
  name: string;
  phone: string;
  reminderTiming?: number;
};

/**
 * Safely formats a phone number for WhatsApp, returns null on failure
 * @param phone - Phone number in any format
 * @returns Formatted WhatsApp string or null if invalid
 */
function safeFormatPhone(phone: string): string | null {
  // First validate the number
  const validation = validateIndianMobile(phone);
  
  if (!validation.valid) {
    console.warn(
      `[WhatsApp] Invalid phone number skipped: "${phone}" — ${validation.error}`
    );
    return null;
  }

  // Then format for WhatsApp
  try {
    return formatWhatsApp(phone);
  } catch (error) {
    if (error instanceof PhoneFormatError) {
      console.warn(
        `[WhatsApp] Phone format error for "${error.originalInput}": ${error.message} (code: ${error.code})`
      );
    } else {
      console.warn(
        `[WhatsApp] Unexpected error formatting phone "${phone}":`,
        error
      );
    }
    return null;
  }
}

/**
 * Send WhatsApp message with phone validation
 * @param to - Recipient phone number (any Indian format)
 * @param message - Message body
 * @returns true if sent successfully, false otherwise
 */
export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  // Validate and format phone number
  const formattedTo = safeFormatPhone(to);
  
  if (!formattedTo) {
    // Phone validation failed — already logged in safeFormatPhone
    return false;
  }

  if (!client) {
    console.log("[WhatsApp] Twilio client not configured, skipping message");
    console.log("[WhatsApp] Would send to:", formattedTo, `(original: ${formatPhoneDisplay(to)})`);
    console.log("[WhatsApp] Message:", message);
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: formattedTo,
    });
    
    console.log("[WhatsApp] Message sent to:", formattedTo);
    return true;
  } catch (error) {
    console.warn("[WhatsApp] Failed to send message:", error);
    return false;
  }
}

/**
 * Get admin phone number from database
 */
async function getAdminPhone(): Promise<string | null> {
  const admin = await prisma.recruiter.findFirst({
    where: { role: "ADMIN" },
    select: { phone: true },
  });
  return admin?.phone ?? null;
}

/**
 * Send notification to both recruiter and admin
 */
async function notifyRecruiterAndAdmin(
  recruiterPhone: string,
  message: string
): Promise<void> {
  const promises: Promise<boolean>[] = [];
  
  // Send to recruiter
  promises.push(sendWhatsApp(recruiterPhone, message));
  
  // Send to admin
  const adminPhone = await getAdminPhone();
  if (adminPhone && adminPhone !== recruiterPhone) {
    promises.push(sendWhatsApp(adminPhone, message));
  }
  
  await Promise.allSettled(promises);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Notify when a new round is created
 */
export async function notifyRoundCreated(
  round: RoundData,
  candidate: CandidateData,
  application: ApplicationData,
  recruiter: RecruiterData
): Promise<void> {
  const dateStr = round.date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const message = [
    "🗓 New Interview Round Scheduled",
    `👤 Candidate: ${candidate.fullName}`,
    `💼 Role: ${application.jobTitle} at ${application.company}`,
    `🔄 Round: ${round.roundType}`,
    `📅 Date: ${dateStr}`,
    `⏰ Time: ${round.time} (${round.timezone})`,
    `⏱ Duration: ${round.duration}`,
    `💻 Mode: ${round.mode}`,
    `🔗 VC Link: ${round.vcReceiver || "Will be shared later"}`,
    "— Tantech ATS",
  ].join("\n");

  await notifyRecruiterAndAdmin(recruiter.phone, message);
}

/**
 * Notify reminder before round
 */
export async function notifyRoundReminder(
  round: RoundData,
  candidate: CandidateData,
  application: ApplicationData,
  recruiter: RecruiterData
): Promise<void> {
  const reminderTiming = recruiter.reminderTiming ?? 60;
  const timingText = reminderTiming >= 60 
    ? `${Math.floor(reminderTiming / 60)} hour${reminderTiming >= 120 ? "s" : ""}`
    : `${reminderTiming} minutes`;

  const message = `⏰ *Interview Reminder*

Starting in *${timingText}*:

*Candidate:* ${candidate.fullName}
*Role:* ${application.jobTitle} at ${application.company}
*Round:* ${round.roundType}
*Link:* ${round.vcReceiver || "TBD"}

— Tantech ATS`;

  await notifyRecruiterAndAdmin(recruiter.phone, message);
}

/**
 * Notify when round status changes
 */
export async function notifyRoundStatusChanged(
  round: RoundData,
  candidate: CandidateData,
  recruiter: RecruiterData,
  newStatus: string
): Promise<void> {
  const statusEmoji: Record<string, string> = {
    PENDING: "🕐",
    CLEARED: "✅",
    RESCHEDULED: "📅",
    FAILED: "❌",
  };

  const message = `📋 *Round Status Updated*

*Candidate:* ${candidate.fullName}
*Round:* ${round.roundType}
*New Status:* ${statusEmoji[newStatus] ?? ""} ${newStatus}

— Tantech ATS`;

  await notifyRecruiterAndAdmin(recruiter.phone, message);
}

/**
 * Notify when candidate is placed
 */
export async function notifyCandidatePlaced(
  candidate: CandidateData,
  recruiter: RecruiterData
): Promise<void> {
  const message = `🎉 *Candidate Placed!*

*${candidate.fullName}* has been placed.
*Recruiter:* ${recruiter.name}

— Tantech ATS`;

  // Only send to admin for placement notifications
  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await sendWhatsApp(adminPhone, message);
  }
}
