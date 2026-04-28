'use server'

import { auth } from "@/lib/auth"
import { parseUtcDateKey, toUtcDateKey } from "@/lib/week-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const targetSchema = z.object({
  recruiterId: z.string().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2030),
  applicationTarget: z.number().min(0).max(1000),
  placementTarget: z.number().min(0).max(1000),
})

const weeklyTargetSchema = z.object({
  weekStartDate: z.string(),
  applicationTarget: z.number().min(0).max(1000).nullable().optional(),
  placementTarget: z.number().min(0).max(1000).nullable().optional(),
})

const setTargetSchema = targetSchema.extend({
  weeklyTargets: z.array(weeklyTargetSchema).optional(),
})

type TargetsView = "month" | "week"

type GetTargetsOptions = {
  month: number
  year: number
  view?: TargetsView
  weekStartDate?: string
}

function getUtcMonthRange(month: number, year: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  }
}

function getMonthRange(month: number, year: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  }
}

function getUtcWeekRangeFromStart(weekStartDate: string) {
  const start = parseUtcDateKey(weekStartDate)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 7)
  return { start, end }
}

function getIsoWeekNumberFromWeekStart(weekStart: Date): number {
  const thursday = new Date(weekStart)
  thursday.setUTCDate(thursday.getUTCDate() + 3)
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const day = firstThursday.getUTCDay()
  const offset = (day + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - offset + 3)
  const diff = thursday.getTime() - firstThursday.getTime()
  return 1 + Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
}

function resolveGetTargetsOptions(input: number | GetTargetsOptions, yearArg?: number): GetTargetsOptions {
  if (typeof input === "number") {
    if (!yearArg) {
      throw new Error("Year is required when using numeric getTargetsAction arguments")
    }
    return { month: input, year: yearArg, view: "month" }
  }
  return {
    month: input.month,
    year: input.year,
    view: input.view ?? "month",
    weekStartDate: input.weekStartDate,
  }
}

export async function setRecruiterTargetAction(payload: {
  recruiterId: string
  month: number
  year: number
  applicationTarget: number
  placementTarget: number
  weeklyTargets?: Array<{
    weekStartDate: string
    applicationTarget?: number | null
    placementTarget?: number | null
  }>
}) {
  console.log("[SetTarget] payload:", payload)

  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  if (session.user.role.toUpperCase() !== "ADMIN") {
    throw new Error("Only admins can set targets")
  }

  const data = setTargetSchema.parse(payload)

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.recruiterTarget.upsert({
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

    if (data.weeklyTargets?.length) {
      for (const weekly of data.weeklyTargets) {
        const weekStart = parseUtcDateKey(weekly.weekStartDate)
        const applicationTarget = weekly.applicationTarget ?? null
        const placementTarget = weekly.placementTarget ?? null

        if (applicationTarget === null && placementTarget === null) {
          await tx.recruiterWeeklyTarget.deleteMany({
            where: {
              recruiterId: data.recruiterId,
              weekStartDate: weekStart,
            },
          })
          continue
        }

        await tx.recruiterWeeklyTarget.upsert({
          where: {
            recruiterId_weekStartDate: {
              recruiterId: data.recruiterId,
              weekStartDate: weekStart,
            },
          },
          update: {
            applicationTarget,
            placementTarget,
            year: weekStart.getUTCFullYear(),
            weekNumber: getIsoWeekNumberFromWeekStart(weekStart),
          },
          create: {
            recruiterId: data.recruiterId,
            weekStartDate: weekStart,
            applicationTarget,
            placementTarget,
            year: weekStart.getUTCFullYear(),
            weekNumber: getIsoWeekNumberFromWeekStart(weekStart),
          },
        })
      }
    }

    return target
  })

  console.log("[SetTarget] saved target:", result.id)
  return { success: true, target: result }
}

export async function getTargetsAction(input: number | GetTargetsOptions, yearArg?: number) {
  const options = resolveGetTargetsOptions(input, yearArg)
  const view = options.view ?? "month"
  console.log("[GetTargets] params:", options)

  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  if (session.user.role.toUpperCase() !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const { start: monthStart, end: monthEnd } = getUtcMonthRange(options.month, options.year)
  const hasWeekRange = view === "week" && !!options.weekStartDate
  const weekRange = hasWeekRange ? getUtcWeekRangeFromStart(options.weekStartDate as string) : null
  const activeStart = weekRange?.start ?? monthStart
  const activeEnd = weekRange?.end ?? monthEnd

  const recruiters = await prisma.recruiter.findMany({
    where: { role: "RECRUITER" },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhotoUrl: true,
      targets: {
        where: { month: options.month, year: options.year },
      },
      weeklyTargets: {
        where: {
          weekStartDate: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      },
      candidates: {
        select: {
          applications: {
            where: {
              createdAt: {
                gte: activeStart,
                lt: activeEnd,
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
    const weeklyTarget = hasWeekRange
      ? recruiter.weeklyTargets.find((item) => weekRange && item.weekStartDate.getTime() === weekRange.start.getTime()) ?? null
      : recruiter.weeklyTargets[0] ?? null
    const allApplications = recruiter.candidates.flatMap((candidate) => candidate.applications)
    const applicationsCount = allApplications.length
    const placementsCount = allApplications.filter((application) => application.status === "PLACED").length

    const activeApplicationTarget = view === "week" ? weeklyTarget?.applicationTarget ?? null : target?.applicationTarget ?? null
    const activePlacementTarget = view === "week" ? weeklyTarget?.placementTarget ?? null : target?.placementTarget ?? null

    const applicationProgress = activeApplicationTarget
      ? Math.round((applicationsCount / activeApplicationTarget) * 100)
      : 0

    const placementProgress = activePlacementTarget
      ? Math.round((placementsCount / activePlacementTarget) * 100)
      : 0

    return {
      id: recruiter.id,
      name: recruiter.name,
      email: recruiter.email,
      profilePhotoUrl: recruiter.profilePhotoUrl,
      target,
      weeklyTarget,
      view,
      activeApplicationTarget,
      activePlacementTarget,
      weeklyTargets: recruiter.weeklyTargets.map((item) => ({
        weekStartDate: toUtcDateKey(item.weekStartDate),
        applicationTarget: item.applicationTarget,
        placementTarget: item.placementTarget,
      })),
      applicationsCount,
      placementsCount,
      applicationProgress: Math.min(applicationProgress, 100),
      placementProgress: Math.min(placementProgress, 100),
      applicationsMet: activeApplicationTarget ? applicationsCount >= activeApplicationTarget : false,
      placementsMet: activePlacementTarget ? placementsCount >= activePlacementTarget : false,
    }
  })
}

export async function getMyTargetAction(month: number, year: number, weekStartDate?: string) {
  console.log("[GetMyTarget] month/year:", month, year)

  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const { start, end } = getMonthRange(month, year)
  const weekRange = weekStartDate ? getUtcWeekRangeFromStart(weekStartDate) : null

  const [target, weeklyTarget, applications, placements, weeklyApplications, weeklyPlacements] = await Promise.all([
    prisma.recruiterTarget.findUnique({
      where: {
        recruiterId_month_year: {
          recruiterId: session.user.id,
          month,
          year,
        },
      },
    }),
    weekRange
      ? prisma.recruiterWeeklyTarget.findUnique({
          where: {
            recruiterId_weekStartDate: {
              recruiterId: session.user.id,
              weekStartDate: weekRange.start,
            },
          },
        })
      : Promise.resolve(null),
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
    weekRange
      ? prisma.application.count({
          where: {
            createdAt: { gte: weekRange.start, lt: weekRange.end },
            candidate: { recruiterId: session.user.id },
          },
        })
      : Promise.resolve(0),
    weekRange
      ? prisma.application.count({
          where: {
            createdAt: { gte: weekRange.start, lt: weekRange.end },
            status: "PLACED",
            candidate: { recruiterId: session.user.id },
          },
        })
      : Promise.resolve(0),
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
    weeklyTarget,
    weeklyApplicationsCount: weeklyApplications,
    weeklyPlacementsCount: weeklyPlacements,
    weeklyApplicationProgress: weeklyTarget?.applicationTarget
      ? Math.min(Math.round((weeklyApplications / weeklyTarget.applicationTarget) * 100), 100)
      : 0,
    weeklyPlacementProgress: weeklyTarget?.placementTarget
      ? Math.min(Math.round((weeklyPlacements / weeklyTarget.placementTarget) * 100), 100)
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