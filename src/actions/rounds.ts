"use server";

import { revalidatePath } from "next/cache";
import { RoundStatus } from "@prisma/client";
import { z } from "zod";

import { parseOrThrow, requireRecruiterOrAdmin } from "@/actions/_helpers";
import { prisma } from "@/lib/prisma";
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  createSharedCalendarEvent,
} from "@/lib/google-calendar";
import { 
  notifyRoundCreated, 
  notifyRoundStatusChanged,
} from "@/lib/whatsapp";
import { inngest } from "@/inngest/client";

const roundSchema = z.object({
  applicationId: z.string().min(1),
  roundType: z.string().min(1),
  date: z.string().datetime().or(z.string().date()),
  time: z.string().min(1),
  timezone: z.string().min(1),
  duration: z.string().min(1),
  mode: z.string().min(1),
  vcReceiver: z.string().optional(),
  coordinator: z.string().optional(),
  lipsync: z.string().optional(),
  feedback: z.string().optional(),
  roundStatus: z.enum(["PENDING", "CLEARED", "RESCHEDULED", "FAILED"]).optional(),
});

const updateRoundSchema = roundSchema.extend({ id: z.string().min(1) });

async function ensureApplicationAccess(applicationId: string, user: { id: string; role: "admin" | "recruiter" }) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (user.role !== "admin" && application.candidate.recruiterId !== user.id) {
    throw new Error("Forbidden");
  }

  return application;
}

export async function createRoundAction(payload: unknown) {
  try {
    const user = await requireRecruiterOrAdmin();
    const data = parseOrThrow(roundSchema, payload);
    const application = await ensureApplicationAccess(data.applicationId, user);

    console.log("[createRoundAction] Creating round for application:", data.applicationId);

    const created = await prisma.round.create({
      data: {
        applicationId: data.applicationId,
        roundType: data.roundType,
        date: new Date(data.date),
        time: data.time,
        timezone: data.timezone,
        duration: data.duration,
        mode: data.mode,
        vcReceiver: data.vcReceiver ?? "",
        frontend: !!data.coordinator,
        lipsync: data.lipsync?.toLowerCase().includes("good") ?? false,
        feedback: data.feedback,
        roundStatus: (data.roundStatus ?? "PENDING") as RoundStatus,
      },
    });

    const applicationWithRelations = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: {
        candidate: {
          include: {
            recruiter: true,
          },
        },
      },
    });

    if (!applicationWithRelations) {
      throw new Error("Application not found");
    }

    const candidate = applicationWithRelations.candidate;
    const recruiter = candidate.recruiter;

    // Google Calendar (non-blocking)
    if (recruiter.calendarConnected && recruiter.googleAccessToken) {
      try {
        const personalEventId = await createCalendarEvent(
          recruiter,
          {
            id: created.id,
            roundType: created.roundType,
            date: created.date,
            time: created.time,
            timezone: created.timezone,
            duration: created.duration,
            mode: created.mode,
            vcReceiver: created.vcReceiver,
          },
          { fullName: candidate.fullName, personalLinkedIn: candidate.personalLinkedIn },
          { jobTitle: applicationWithRelations.jobTitle, company: applicationWithRelations.company }
        );

        const sharedEventId = await createSharedCalendarEvent(
          {
            id: created.id,
            roundType: created.roundType,
            date: created.date,
            time: created.time,
            timezone: created.timezone,
            duration: created.duration,
            mode: created.mode,
            vcReceiver: created.vcReceiver,
          },
          { fullName: candidate.fullName, personalLinkedIn: candidate.personalLinkedIn },
          { jobTitle: applicationWithRelations.jobTitle, company: applicationWithRelations.company },
          recruiter.name
        );

        await prisma.round.update({
          where: { id: created.id },
          data: {
            googleCalendarEventId: personalEventId ?? undefined,
            adminCalendarEventId: sharedEventId ?? undefined,
          },
        });

        console.log("[createRoundAction] Calendar events created:", { personalEventId, sharedEventId });
      } catch (calendarError) {
        console.error("[createRoundAction] Calendar error:", calendarError);
      }
    } else {
      console.log("[createRoundAction] Calendar not connected for recruiter:", recruiter.id);
    }

    // WhatsApp notification (non-blocking)
    try {
      await notifyRoundCreated(
        {
          roundType: created.roundType,
          date: created.date,
          time: created.time,
          timezone: created.timezone,
          duration: created.duration,
          mode: created.mode,
          vcReceiver: created.vcReceiver,
          roundStatus: created.roundStatus,
        },
        { fullName: candidate.fullName },
        { jobTitle: applicationWithRelations.jobTitle, company: applicationWithRelations.company },
        { name: recruiter.name, phone: recruiter.phone, reminderTiming: recruiter.reminderTiming }
      );
      console.log("[createRoundAction] WhatsApp notification sent");
    } catch (whatsappError) {
      console.error("[createRoundAction] WhatsApp error:", whatsappError);
    }

    // Inngest reminder
    try {
      const roundDateTime = new Date(`${data.date}T${data.time}`);
      const reminderMinutes = recruiter.reminderTiming ?? 60;
      const reminderTime = new Date(roundDateTime.getTime() - reminderMinutes * 60 * 1000);

      if (reminderTime > new Date()) {
        await inngest.send({
          name: "round/reminder.schedule",
          data: { roundId: created.id, recruiterId: recruiter.id },
          ts: reminderTime.getTime(),
        });
        console.log("[createRoundAction] Reminder scheduled for:", reminderTime);
      }
    } catch (inngestError) {
      console.error("[createRoundAction] Inngest error:", inngestError);
    }

    revalidatePath(`/dashboard/candidates/${application.candidateId}`);
    return { success: true, roundId: created.id };
  } catch (error) {
    console.error("[createRoundAction] Error:", error);
    return { success: false, error: "Failed to create round" };
  }
}

export async function updateRoundAction(payload: unknown) {
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(updateRoundSchema, payload);

  const existing = await prisma.round.findUnique({ 
    where: { id: data.id },
    include: {
      application: {
        include: {
          candidate: {
            include: { recruiter: true },
          },
        },
      },
    },
  });
  if (!existing) {
    throw new Error("Round not found");
  }

  const application = await ensureApplicationAccess(existing.applicationId, user);

  const updated = await prisma.round.update({
    where: { id: data.id },
    data: {
      roundType: data.roundType,
      date: new Date(data.date),
      time: data.time,
      timezone: data.timezone,
      duration: data.duration,
      mode: data.mode,
      vcReceiver: data.vcReceiver ?? "",
      frontend: !!data.coordinator,
      lipsync: data.lipsync?.toLowerCase().includes("good") ?? false,
      feedback: data.feedback,
      roundStatus: (data.roundStatus ?? "PENDING") as RoundStatus,
    },
  });

  const candidate = existing.application.candidate;
  const recruiter = candidate.recruiter;

  // Check if date/time changed
  const dateChanged = existing.date.toISOString() !== new Date(data.date).toISOString() || existing.time !== data.time;
  
  // Check if status changed
  const statusChanged = existing.roundStatus !== data.roundStatus;

  // Handle integrations asynchronously
  (async () => {
    try {
      // Update calendar events if date/time changed
      if (dateChanged) {
        const roundData = {
          id: data.id,
          roundType: data.roundType,
          date: new Date(data.date),
          time: data.time,
          timezone: data.timezone,
          duration: data.duration,
          mode: data.mode,
          vcReceiver: data.vcReceiver ?? "",
        };

        // Update personal calendar
        if (existing.googleCalendarEventId) {
          await updateCalendarEvent(
            recruiter,
            existing.googleCalendarEventId,
            roundData,
            { fullName: candidate.fullName, personalLinkedIn: candidate.personalLinkedIn },
            { jobTitle: application.jobTitle, company: application.company }
          );
        }

        // Reschedule Inngest reminder
        // Note: Inngest doesn't support cancellation directly, but we can check reminderSent in the function
        const roundDateTime = new Date(data.date);
        const [hours, minutes] = data.time.split(":").map(Number);
        roundDateTime.setHours(hours, minutes, 0, 0);
        
        const reminderTime = new Date(roundDateTime.getTime() - recruiter.reminderTiming * 60 * 1000);
        
        if (reminderTime > new Date()) {
          // Reset reminderSent and schedule new reminder
          await prisma.round.update({
            where: { id: data.id },
            data: { reminderSent: false },
          });
          
          await inngest.send({
            name: "round/reminder.schedule",
            data: {
              roundId: data.id,
              recruiterId: recruiter.id,
            },
            ts: reminderTime.getTime(),
          });
        }
      }

      // Notify if status changed
      if (statusChanged) {
        await notifyRoundStatusChanged(
          {
            roundType: data.roundType,
            date: new Date(data.date),
            time: data.time,
            timezone: data.timezone,
            mode: data.mode,
            vcReceiver: data.vcReceiver ?? "",
            roundStatus: data.roundStatus,
          },
          { fullName: candidate.fullName },
          { name: recruiter.name, phone: recruiter.phone },
          data.roundStatus
        );
      }
    } catch (err) {
      console.error("[Round Update] Integration error:", err);
    }
  })();

  revalidatePath(`/dashboard/candidates/${application.candidateId}`);
  return { success: true, data: updated };
}

export async function deleteRoundAction(id: string) {
  const user = await requireRecruiterOrAdmin();
  const existing = await prisma.round.findUnique({ 
    where: { id },
    include: {
      application: {
        include: {
          candidate: {
            include: { recruiter: true },
          },
        },
      },
    },
  });
  if (!existing) {
    throw new Error("Round not found");
  }

  const application = await ensureApplicationAccess(existing.applicationId, user);
  
  // Delete calendar events before deleting round
  const recruiter = existing.application.candidate.recruiter;
  
  (async () => {
    try {
      // Delete personal calendar event
      if (existing.googleCalendarEventId) {
        await deleteCalendarEvent(recruiter, existing.googleCalendarEventId);
      }
      // Note: Shared calendar event deletion would need service account
    } catch (err) {
      console.error("[Round Delete] Calendar deletion error:", err);
    }
  })();

  await prisma.round.delete({ where: { id } });

  revalidatePath(`/dashboard/candidates/${application.candidateId}`);
  return { success: true };
}
