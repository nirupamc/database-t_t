import { prisma } from "@/lib/prisma";
import { formatWhatsApp } from "@/lib/phone-utils";

async function sendWhatsApp(to: string, message: string) {
  console.log("[WhatsApp] Sending message to:", to);

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.error("[WhatsApp] Missing Twilio environment variables");
    throw new Error("Twilio configuration missing");
  }

  const toFormatted = formatWhatsApp(to);
  const fromFormatted = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const body = new URLSearchParams({
    To: toFormatted,
    From: fromFormatted,
    Body: message,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[WhatsApp] Twilio API error:", errorText);
    throw new Error("Failed to send WhatsApp message");
  }

  console.log("[WhatsApp] Message sent successfully");
}

export async function notifyRoundReminder(
  round: {
    roundType: string;
    time: string;
    timezone: string;
    mode: string;
    vcReceiver?: string | null;
  },
  candidate: { fullName: string },
  application: { jobTitle: string; company: string },
  recruiter: {
    phone: string | null;
    name: string;
    reminderTiming?: number;
  }
) {
  console.log("[WhatsApp] Sending reminder notification");

  const reminderMinutes = recruiter.reminderTiming ?? 60;
  const timeLabel = reminderMinutes >= 60
    ? `${reminderMinutes / 60} hour(s)`
    : `${reminderMinutes} minutes`;

  const message = `⏰ *Interview Reminder*

Starting in ${timeLabel}:

👤 Candidate: ${candidate.fullName}
💼 Role: ${application.jobTitle} at ${application.company}
🔄 Round: ${round.roundType}
⏰ Time: ${round.time} (${round.timezone})
💻 Mode: ${round.mode}
🔗 Link: ${round.vcReceiver || "Check your calendar"}

— Tantech ATS`;

  // Get admin phone
  const admin = await prisma.recruiter.findFirst({
    where: { role: "ADMIN" },
    select: { phone: true },
  });

  // Send to recruiter
  if (recruiter.phone) {
    await sendWhatsApp(recruiter.phone, message);
  } else {
    console.log("[WhatsApp] Recruiter phone missing, skipping recruiter notification");
  }

  // Send to admin (if different number)
  if (admin?.phone && admin.phone !== recruiter.phone) {
    await sendWhatsApp(admin.phone, message);
  }
}

