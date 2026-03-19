import { inngest } from "../client";
import { prisma } from "@/lib/prisma";

export const sendRoundReminder = inngest.createFunction(
  {
    id: "send-round-reminder",
    name: "Send Round Reminder",
    retries: 2,
  },
  { event: "round/reminder.schedule" },
  async ({ event, step }) => {
    const { roundId, recruiterId } = event.data as { roundId: string; recruiterId: string };

    console.log("[RoundReminder] Starting for roundId:", roundId);

    const round = await step.run("fetch-round", async () => {
      return prisma.round.findUnique({
        where: { id: roundId },
        include: {
          application: {
            include: {
              candidate: {
                include: {
                  recruiter: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                      reminderTiming: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    if (!round) {
      console.log("[RoundReminder] Round not found, skipping");
      return { message: "Round not found" };
    }

    if (round.roundStatus !== "PENDING" && round.roundStatus !== "RESCHEDULED") {
      console.log("[RoundReminder] Round not pending, skipping:", round.roundStatus);
      return { message: `Round status is ${round.roundStatus}, skipping` };
    }

    if (round.reminderSent) {
      console.log("[RoundReminder] Reminder already sent, skipping");
      return { message: "Reminder already sent" };
    }

    const candidate = round.application.candidate;
    const recruiter = candidate.recruiter;
    const application = round.application;

    await step.run("send-whatsapp-reminder", async () => {
      console.log("[RoundReminder] Sending WhatsApp to:", recruiter.phone);

      const { notifyRoundReminder } = await import("@/lib/whatsapp");

      await notifyRoundReminder(round, candidate, application, recruiter);

      await prisma.round.update({
        where: { id: roundId },
        data: { reminderSent: true },
      });

      console.log("[RoundReminder] ✅ Reminder sent successfully");
    });

    return {
      message: "Reminder sent successfully",
      roundId,
      recruiterId,
    };
  }
);

