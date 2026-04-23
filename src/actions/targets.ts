'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const targetSchema = z.object({
  recruiterId: z.string().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2030),
  applicationTarget: z.number().min(0).max(1000),
  placementTarget: z.number().min(0).max(1000),
})

function getMonthRange(month: number, year: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  }
}

export async function setRecruiterTargetAction(payload: {
  recruiterId: string
  month: number
  year: number
  applicationTarget: number
  placementTarget: number
}) {
  console.log("[SetTarget] payload:", payload)

  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  if (session.user.role.toUpperCase() !== "ADMIN") {
    throw new Error("Only admins can set targets")
  }

  const data = targetSchema.parse(payload)

  const target = await prisma.recruiterTarget.upsert({
    where: {
      recruiterId_month_year: {
        recruiterId: data.recruiterId,
        month: data.month,
        year: data.year,
      },
    },
    update: {
      applicationTarget: data.applicationTarget,
      placementTarget: data.placementTarget,
    },
    create: {
      recruiterId: data.recruiterId,
      month: data.month,
      year: data.year,
      applicationTarget: data.applicationTarget,
      placementTarget: data.placementTarget,
    },
  })

  console.log("[SetTarget] saved target:", target.id)
  return { success: true, target }
}

export async function getTargetsAction(month: number, year: number) {
  console.log("[GetTargets] month/year:", month, year)

  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  if (session.user.role.toUpperCase() !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const { start, end } = getMonthRange(month, year)

  const recruiters = await prisma.recruiter.findMany({
    where: { role: "RECRUITER" },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhotoUrl: true,
      targets: {
        where: { month, year },
      },
      candidates: {
        select: {
          applications: {
            where: {
              createdAt: {
                gte: start,
                lt: end,
              },
            },
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return recruiters.map((recruiter) => {
    const target = recruiter.targets[0] ?? null
    const allApplications = recruiter.candidates.flatMap((candidate) => candidate.applications)
    const applicationsCount = allApplications.length
    const placementsCount = allApplications.filter((application) => application.status === "PLACED").length

    const applicationProgress = target?.applicationTarget
      ? Math.round((applicationsCount / target.applicationTarget) * 100)
      : 0

    const placementProgress = target?.placementTarget
      ? Math.round((placementsCount / target.placementTarget) * 100)
      : 0

    return {
      id: recruiter.id,
      name: recruiter.name,
      email: recruiter.email,
      profilePhotoUrl: recruiter.profilePhotoUrl,
      target,
      applicationsCount,
      placementsCount,
      applicationProgress: Math.min(applicationProgress, 100),
      placementProgress: Math.min(placementProgress, 100),
      applicationsMet: target ? applicationsCount >= target.applicationTarget : false,
      placementsMet: target ? placementsCount >= target.placementTarget : false,
    }
  })
}

export async function getMyTargetAction(month: number, year: number) {
  console.log("[GetMyTarget] month/year:", month, year)

  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const { start, end } = getMonthRange(month, year)

  const [target, applications, placements] = await Promise.all([
    prisma.recruiterTarget.findUnique({
      where: {
        recruiterId_month_year: {
          recruiterId: session.user.id,
          month,
          year,
        },
      },
    }),
    prisma.application.count({
      where: {
        createdAt: { gte: start, lt: end },
        candidate: { recruiterId: session.user.id },
      },
    }),
    prisma.application.count({
      where: {
        createdAt: { gte: start, lt: end },
        status: "PLACED",
        candidate: { recruiterId: session.user.id },
      },
    }),
  ])

  return {
    target,
    applicationsCount: applications,
    placementsCount: placements,
    applicationProgress: target?.applicationTarget
      ? Math.min(Math.round((applications / target.applicationTarget) * 100), 100)
      : 0,
    placementProgress: target?.placementTarget
      ? Math.min(Math.round((placements / target.placementTarget) * 100), 100)
      : 0,
  }
}

export async function checkDuplicateApplicationAction(payload: {
  candidateId: string
  company: string
  jobTitle: string
}) {
  console.log("[CheckDuplicate] payload:", payload)

  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const candidate = await prisma.candidate.findUnique({
    where: { id: payload.candidateId },
    select: {
      id: true,
      fullName: true,
      recruiter: {
        select: { name: true },
      },
    },
  })

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  const existing = await prisma.application.findFirst({
    where: {
      candidateId: payload.candidateId,
      company: { equals: payload.company.trim(), mode: "insensitive" },
      jobTitle: { equals: payload.jobTitle.trim(), mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    return {
      isDuplicate: true,
      existingApplication: {
        id: existing.id,
        company: existing.company,
        jobTitle: existing.jobTitle,
        status: existing.status,
        appliedDate: existing.appliedDate,
        submittedBy: candidate.recruiter.name,
      },
    }
  }

  const sameCompany = await prisma.application.findFirst({
    where: {
      candidateId: payload.candidateId,
      company: { equals: payload.company.trim(), mode: "insensitive" },
    },
    select: {
      id: true,
      jobTitle: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return {
    isDuplicate: false,
    sameCompanyExists: !!sameCompany,
    sameCompanyApplication: sameCompany,
  }
}