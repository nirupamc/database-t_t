"use server";

import { revalidatePath } from "next/cache";
import { CandidateStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { parseOrThrow, requireRecruiterOrAdmin } from "@/actions/_helpers";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const candidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  personalLinkedIn: z.string().url(),
  profilePhotoUrl: z.string().url().optional().or(z.literal("")),
  resumeUrl: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().int().nonnegative(),
  location: z.string().min(2),
  noticePeriod: z.string().min(1),
  expectedCTC: z.string().min(1),
  status: z.enum(["ACTIVE", "ON_HOLD", "PLACED", "REJECTED"]).default("ACTIVE"),
  recruiterId: z.string().min(1),
  uvPhone: z.string().optional().nullable(),
  uvPassword: z.string().optional().nullable(),
});

const updateCandidateSchema = candidateSchema.extend({
  id: z.string().min(1),
});

export async function listCandidatesAction() {
  const user = await requireRecruiterOrAdmin();

  return prisma.candidate.findMany({
    where: user.role === "admin" ? {} : { recruiterId: user.id },
    include: {
      recruiter: true,
      applications: {
        include: { rounds: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCandidateByIdAction(id: string) {
  const user = await requireRecruiterOrAdmin();

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      recruiter: true,
      applications: {
        include: { rounds: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!candidate) {
    return null;
  }

  if (user.role !== "admin" && candidate.recruiterId !== user.id) {
    throw new Error("Forbidden");
  }

  return candidate;
}

export async function createCandidateAction(payload: unknown) {
  const session = await getCurrentSession();
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(candidateSchema, payload);
  const resumeUrl = data.resumeUrl?.trim();

  try {
    const created = await prisma.candidate.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        personalLinkedIn: data.personalLinkedIn,
        profilePhotoUrl: data.profilePhotoUrl || null,
        resumeUrl: resumeUrl ? resumeUrl : null,
        skills: data.skills,
        experienceYears: data.experienceYears,
        location: data.location,
        noticePeriod: data.noticePeriod,
        expectedCTC: data.expectedCTC,
        status: data.status as CandidateStatus,
        recruiterId: user.role === "admin" ? data.recruiterId : user.id,
        addedBy: session?.user?.email ?? "system",
        uvPhone: data.uvPhone || null,
        uvPassword: data.uvPassword || null,
      },
    });

    revalidatePath("/dashboard/candidates");
    revalidatePath("/admin/candidates");
    return { success: true, data: created };
  } catch (error) {
    console.error("[createCandidateAction] Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "A candidate with this email already exists" };
    }
    return { success: false, error: "Failed to create candidate. Please try again." };
  }
}

export async function updateCandidateAction(payload: unknown) {
  try {
    const user = await requireRecruiterOrAdmin();
    const data = parseOrThrow(updateCandidateSchema, payload);

    const existing = await prisma.candidate.findUnique({ where: { id: data.id } });
    if (!existing) {
      return { success: false, error: "Candidate not found" };
    }

    if (user.role !== "admin" && existing.recruiterId !== user.id) {
      return { success: false, error: "You don't have permission to edit this candidate" };
    }

    const normalizedResumeUrl = data.resumeUrl?.trim();
    const nextResumeUrl =
      normalizedResumeUrl && normalizedResumeUrl.length > 0
        ? normalizedResumeUrl
        : existing.resumeUrl ?? null;

    const updated = await prisma.candidate.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        personalLinkedIn: data.personalLinkedIn,
        profilePhotoUrl: data.profilePhotoUrl || null,
        resumeUrl: nextResumeUrl,
        skills: data.skills,
        experienceYears: data.experienceYears,
        location: data.location,
        noticePeriod: data.noticePeriod,
        expectedCTC: data.expectedCTC,
        status: data.status as CandidateStatus,
        recruiterId: user.role === "admin" ? data.recruiterId : existing.recruiterId,
        uvPhone: data.uvPhone || null,
        uvPassword: data.uvPassword || null,
      },
    });

    revalidatePath("/dashboard/candidates");
    revalidatePath("/admin/candidates");
    revalidatePath(`/dashboard/candidates/${data.id}`);
    revalidatePath(`/admin/candidates/${data.id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateCandidateAction] Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "A candidate with this email already exists" };
    }
    return { success: false, error: "Failed to update candidate. Please try again." };
  }
}

export async function deleteCandidateAction(id: string) {
  const user = await requireRecruiterOrAdmin();
  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Candidate not found");
  }

  if (user.role !== "admin" && existing.recruiterId !== user.id) {
    throw new Error("Forbidden");
  }

  await prisma.candidate.delete({ where: { id } });

  revalidatePath("/dashboard/candidates");
  revalidatePath("/admin/candidates");
  return { success: true };
}
