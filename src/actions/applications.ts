"use server";

import { revalidatePath } from "next/cache";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";

import { parseOrThrow, requireRecruiterOrAdmin } from "@/actions/_helpers";
import { prisma } from "@/lib/prisma";

const appSchema = z.object({
  candidateId: z.string().min(1),
  jobTitle: z.string().optional().default(""),
  company: z.string().optional().default(""),
  jobUrl: z.string().url(),
  source: z.string().min(1),
  techTags: z.array(z.string()).default([]),
  appliedDate: z.string().datetime().or(z.string().date()),
  status: z.enum([
    "APPLIED",
    "INTERVIEW_SCHEDULED",
    "FEEDBACK_RECEIVED",
    "OFFER_EXTENDED",
    "PLACED",
    "REJECTED",
    "ON_HOLD",
  ]),
  resumeUsedUrl: z.string().nullable().optional(),
  resumeUsedLabel: z.string().nullable().optional(),
});

const updateAppSchema = appSchema.extend({ id: z.string().min(1) });

async function ensureCandidateAccess(candidateId: string, user: { id: string; role: string }) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) {
    throw new Error("Candidate not found");
  }

  if (user.role.toUpperCase() !== "ADMIN" && candidate.recruiterId !== user.id) {
    throw new Error("Forbidden");
  }

  return candidate;
}

export async function createApplicationAction(payload: unknown) {
  console.log('[createApplicationAction] payload:', payload)
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(appSchema, payload);

  console.log('[createApplicationAction] parsed data:', {
    resumeUsedUrl: data.resumeUsedUrl,
    resumeUsedLabel: data.resumeUsedLabel,
  });

  await ensureCandidateAccess(data.candidateId, user);

  const created = await prisma.application.create({
    data: {
      candidateId: data.candidateId,
      jobTitle: data.jobTitle,
      company: data.company,
      jobUrl: data.jobUrl,
      source: data.source,
      techTags: data.techTags,
      appliedDate: new Date(data.appliedDate),
      status: data.status as ApplicationStatus,
      resumeUsedUrl: data.resumeUsedUrl ?? null,
      resumeUsedLabel: data.resumeUsedLabel ?? null,
    },
  });

  console.log('[createApplicationAction] created application:', {
    id: created.id,
    resumeUsedUrl: created.resumeUsedUrl,
    resumeUsedLabel: created.resumeUsedLabel,
  })
  revalidatePath(`/dashboard/candidates/${data.candidateId}`);
  revalidatePath("/dashboard/applications");
  revalidatePath("/admin/candidates");
  return { success: true, data: created };
}

export async function updateApplicationAction(payload: unknown) {
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(updateAppSchema, payload);

  const existing = await prisma.application.findUnique({ where: { id: data.id } });
  if (!existing) {
    throw new Error("Application not found");
  }

  await ensureCandidateAccess(existing.candidateId, user);

  const updated = await prisma.application.update({
    where: { id: data.id },
    data: {
      jobTitle: data.jobTitle,
      company: data.company,
      jobUrl: data.jobUrl,
      source: data.source,
      techTags: data.techTags,
      appliedDate: new Date(data.appliedDate),
      status: data.status as ApplicationStatus,
    },
  });

  revalidatePath(`/dashboard/candidates/${existing.candidateId}`);
  revalidatePath("/dashboard/applications");
  return { success: true, data: updated };
}

export async function deleteApplicationAction(id: string) {
  const user = await requireRecruiterOrAdmin();
  const existing = await prisma.application.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Application not found");
  }

  await ensureCandidateAccess(existing.candidateId, user);
  await prisma.application.delete({ where: { id } });

  revalidatePath(`/dashboard/candidates/${existing.candidateId}`);
  revalidatePath("/dashboard/applications");
  return { success: true };
}
