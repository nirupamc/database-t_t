"use server";

import { revalidatePath } from "next/cache";
import { CandidateStatus } from "@prisma/client";
import { z } from "zod";

import { parseOrThrow, requireRecruiterOrAdmin } from "@/actions/_helpers";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const candidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(2),
  personalLinkedIn: z.string().url().optional().or(z.literal("")),
  profilePhotoUrl: z.string().optional().nullable().or(z.literal("")),
  resumeUrl: z.string().optional().nullable().or(z.literal("")),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().int().nonnegative(),
  location: z.string().min(2),
  noticePeriod: z.string().min(1),
  expectedCTC: z.string().min(1),
  status: z.enum(["ACTIVE", "ON_HOLD", "PLACED", "REJECTED"]).default("ACTIVE"),
  recruiterId: z.string().min(1),
  uvPhone: z.string().optional().nullable(),
  uvPassword: z.string().optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "FREELANCE", "CONTRACT", "INTERNSHIP"]).optional().nullable(),
  workMode: z.enum(["ON_SITE", "HYBRID", "REMOTE"]).optional().nullable(),
  candidateType: z.enum(["OPT", "FULL_TIME", "C2C"]).optional().nullable(),
});

const updateCandidateSchema = candidateSchema.extend({
  id: z.string().min(1),
  recruiterId: z.string().optional().default(""),
});

export async function listCandidatesAction() {
  const user = await requireRecruiterOrAdmin();

  return prisma.candidate.findMany({
    where: user.role.toUpperCase() === "ADMIN" ? {} : { recruiterId: user.id },
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

  if (user.role.toUpperCase() !== "ADMIN" && candidate.recruiterId !== user.id) {
    throw new Error("Forbidden");
  }

  return candidate;
}

export async function createCandidateAction(payload: unknown) {
  const session = await getCurrentSession();
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(candidateSchema, payload);

  const created = await prisma.candidate.create({
    data: {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      personalLinkedIn: data.personalLinkedIn || null,
      profilePhotoUrl: data.profilePhotoUrl || null,
      resumeUrl: data.resumeUrl || null,
      skills: data.skills,
      experienceYears: data.experienceYears,
      location: data.location,
      noticePeriod: data.noticePeriod,
      expectedCTC: data.expectedCTC,
      status: data.status as CandidateStatus,
      recruiterId: user.role.toUpperCase() === "ADMIN" ? data.recruiterId : user.id,
      addedBy: session?.user?.email ?? "system",
      uvPhone: data.uvPhone || null,
      uvPassword: data.uvPassword || null,
      employmentType: data.employmentType || null,
      workMode: data.workMode || null,
      candidateType: data.candidateType || null,
    },
  });

  revalidatePath("/dashboard/candidates");
  revalidatePath("/admin/candidates");
  return { success: true, data: created };
}

export async function updateCandidateAction(payload: unknown) {
  const user = await requireRecruiterOrAdmin();
  const data = parseOrThrow(updateCandidateSchema, payload);

  const existing = await prisma.candidate.findUnique({ where: { id: data.id } });
  if (!existing) {
    throw new Error("Candidate not found");
  }

  if (user.role.toUpperCase() !== "ADMIN" && existing.recruiterId !== user.id) {
    throw new Error("Forbidden");
  }

  const updated = await prisma.candidate.update({
    where: { id: data.id },
    data: {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      personalLinkedIn: data.personalLinkedIn,
      profilePhotoUrl: data.profilePhotoUrl || null,
      resumeUrl: data.resumeUrl || null,
      skills: data.skills,
      experienceYears: data.experienceYears,
      location: data.location,
      noticePeriod: data.noticePeriod,
      expectedCTC: data.expectedCTC,
      status: data.status as CandidateStatus,
      // preserve existing recruiterId if admin didn't change it or if recruiter is editing
      recruiterId: (user.role.toUpperCase() === "ADMIN" && data.recruiterId) ? data.recruiterId : existing.recruiterId,
      uvPhone: data.uvPhone || null,
      uvPassword: data.uvPassword || null,
      employmentType: data.employmentType || null,
      workMode: data.workMode || null,
      candidateType: data.candidateType || null,
    },
  });

  revalidatePath("/dashboard/candidates");
  revalidatePath("/admin/candidates");
  revalidatePath(`/dashboard/candidates/${data.id}`);
  revalidatePath(`/admin/candidates/${data.id}`);
  return { success: true, data: updated };
}

export async function deleteCandidateAction(id: string) {
  const user = await requireRecruiterOrAdmin();
  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Candidate not found");
  }

  if (user.role.toUpperCase() !== "ADMIN" && existing.recruiterId !== user.id) {
    throw new Error("Forbidden");
  }

  await prisma.candidate.delete({ where: { id } });

  revalidatePath("/dashboard/candidates");
  revalidatePath("/admin/candidates");
  return { success: true };
}

// Simple action to reassign a candidate to a different recruiter (admin only)
export async function reassignCandidateAction(candidateId: string, newRecruiterId: string) {
  const user = await requireRecruiterOrAdmin();
  
  // Only admin can reassign
  if (user.role.toUpperCase() !== "ADMIN") {
    throw new Error("Only admins can reassign candidates");
  }

  console.log('[reassignCandidateAction] Reassigning candidate:', candidateId, 'to recruiter:', newRecruiterId);

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    throw new Error("Candidate not found");
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { recruiterId: newRecruiterId },
  });

  revalidatePath("/dashboard/candidates");
  revalidatePath("/admin/candidates");
  revalidatePath(`/dashboard/candidates/${candidateId}`);
  
  return { success: true };
}
