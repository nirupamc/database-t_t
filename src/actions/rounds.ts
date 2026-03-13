"use server";

import { revalidatePath } from "next/cache";
import { RoundStatus } from "@prisma/client";
import { z } from "zod";

import { parseOrThrow, requireRecruiterOrAdmin } from "@/actions/_helpers";
import { prisma } from "@/lib/prisma";

const roundSchema = z.object({
  applicationId: z.string().min(1),
  roundType: z.string().min(1),
  date: z.string().datetime().or(z.string().date()),
  time: z.string().min(1),
  timezone: z.string().min(1),
  duration: z.string().min(1),
  mode: z.string().min(1),
  vcReceiver: z.string().min(1),
  frontend: z.boolean(),
  lipsync: z.boolean(),
  feedback: z.string().optional(),
  roundStatus: z.enum(["PENDING", "CLEARED", "RESCHEDULED", "FAILED"]),
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
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(roundSchema, payload);
  const application = await ensureApplicationAccess(data.applicationId, user);

  const created = await prisma.round.create({
    data: {
      applicationId: data.applicationId,
      roundType: data.roundType,
      date: new Date(data.date),
      time: data.time,
      timezone: data.timezone,
      duration: data.duration,
      mode: data.mode,
      vcReceiver: data.vcReceiver,
      frontend: data.frontend,
      lipsync: data.lipsync,
      feedback: data.feedback,
      roundStatus: data.roundStatus as RoundStatus,
    },
  });

  revalidatePath(`/dashboard/candidates/${application.candidateId}`);
  return { success: true, data: created };
}

export async function updateRoundAction(payload: unknown) {
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(updateRoundSchema, payload);

  const existing = await prisma.round.findUnique({ where: { id: data.id } });
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
      vcReceiver: data.vcReceiver,
      frontend: data.frontend,
      lipsync: data.lipsync,
      feedback: data.feedback,
      roundStatus: data.roundStatus as RoundStatus,
    },
  });

  revalidatePath(`/dashboard/candidates/${application.candidateId}`);
  return { success: true, data: updated };
}

export async function deleteRoundAction(id: string) {
  const user = await requireRecruiterOrAdmin();
  const existing = await prisma.round.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Round not found");
  }

  const application = await ensureApplicationAccess(existing.applicationId, user);
  await prisma.round.delete({ where: { id } });

  revalidatePath(`/dashboard/candidates/${application.candidateId}`);
  return { success: true };
}
