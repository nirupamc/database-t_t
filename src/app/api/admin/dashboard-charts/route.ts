import { NextResponse } from "next/server"

import { APP_LAUNCH_DATE } from "@/lib/constants"
import { prisma } from "@/lib/prisma"
import {
  clampWeekStart,
  getUtcDayRange,
  getUtcWeekRange,
  parseUtcDateKey,
  startOfCurrentUtcWeek,
  toUtcDateKey,
} from "@/lib/week-utils"

interface DailyPoint {
  date: string
  count: number
}

interface RecruiterCount {
  name: string
  count: number
}

interface EmployeeSubmissionCount {
  name: string
  count: number
}

interface TargetProgressPoint {
  name: string
  target: number
  achieved: number
}

interface StageCount {
  stage: string
  count: number
}

interface AvgPlacementTimePoint {
  date: string
  days: number
}

interface PlacementMetrics {
  placementSeries: DailyPoint[]
  avgPlacementTimeSeries: AvgPlacementTimePoint[]
  avgTimeToPlacementDays: number
  placementsInPeriod: number
}

interface SnapshotWindow {
  snapshotDate: string
  snapshotEndExclusive: Date
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function clampUtcDate(date: Date, minDate: Date, maxDate: Date) {
  if (date < minDate) return minDate
  if (date > maxDate) return maxDate
  return date
}

function buildUtcDailyRange(start: Date, end: Date) {
  const keys: string[] = []
  const cursor = new Date(start)
  while (cursor < end) {
    keys.push(toUtcDateKey(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return keys
}

function toStageLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function resolveWeekStartDate(queryValue: string | null) {
  const minWeekStart = getUtcWeekRange(APP_LAUNCH_DATE).start
  const maxWeekStart = startOfCurrentUtcWeek()

  if (!queryValue) {
    return maxWeekStart
  }

  try {
    const requested = parseUtcDateKey(queryValue)
    return clampWeekStart(requested, minWeekStart, maxWeekStart)
  } catch {
    return maxWeekStart
  }
}

function resolveSnapshotWindow(weekStart: Date, weekEnd: Date, snapshotDateQuery: string | null): SnapshotWindow {
  if (snapshotDateQuery) {
    try {
      const minSnapshotDate = startOfUtcDay(APP_LAUNCH_DATE)
      const maxSnapshotDate = startOfUtcDay(new Date())
      const requestedSnapshotDate = parseUtcDateKey(snapshotDateQuery)
      const clampedSnapshotDate = clampUtcDate(requestedSnapshotDate, minSnapshotDate, maxSnapshotDate)
      const snapshotDay = getUtcDayRange(clampedSnapshotDate)
      return {
        snapshotDate: toUtcDateKey(snapshotDay.start),
        snapshotEndExclusive: snapshotDay.end,
      }
    } catch {
      // Fall through to existing week-based snapshot behavior.
    }
  }

  const currentWeekStart = startOfCurrentUtcWeek()

  if (weekStart.getTime() === currentWeekStart.getTime()) {
    const todayRange = getUtcDayRange(new Date())
    return {
      snapshotDate: toUtcDateKey(todayRange.start),
      snapshotEndExclusive: todayRange.end,
    }
  }

  return {
    snapshotDate: toUtcDateKey(new Date(weekEnd.getTime() - 24 * 60 * 60 * 1000)),
    snapshotEndExclusive: weekEnd,
  }
}

async function getDailyApplications(weekStart: Date, weekEnd: Date): Promise<DailyPoint[]> {
  try {
    const rows = await prisma.application.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        createdAt: true,
      },
    })

    const byDate = new Map<string, number>()
    for (const row of rows) {
      const key = toUtcDateKey(row.createdAt)
      byDate.set(key, (byDate.get(key) ?? 0) + 1)
    }

    return buildUtcDailyRange(weekStart, weekEnd).map((key) => ({
      date: key,
      count: byDate.get(key) ?? 0,
    }))
  } catch (error) {
    console.error("[dashboard-charts] getDailyApplications failed:", error)
    return []
  }
}

async function getRecruiterApplicationCounts(weekStart: Date, weekEnd: Date): Promise<RecruiterCount[]> {
  try {
    const recruiters = await prisma.recruiter.findMany({
      where: {
        role: "RECRUITER",
        createdAt: {
          lt: weekEnd,
        },
      },
      select: {
        name: true,
        candidates: {
          select: {
            applications: {
              where: {
                createdAt: {
                  gte: weekStart,
                  lt: weekEnd,
                },
              },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return recruiters.map((recruiter) => ({
      name: recruiter.name,
      count: recruiter.candidates.reduce((sum, candidate) => sum + candidate.applications.length, 0),
    }))
  } catch (error) {
    console.error("[dashboard-charts] getRecruiterApplicationCounts failed:", error)
    return []
  }
}

async function getCandidateSubmissionLeaderboard(snapshotDate: string, snapshotEndExclusive: Date): Promise<EmployeeSubmissionCount[]> {
  try {
    const { start: snapshotStart } = getUtcDayRange(parseUtcDateKey(snapshotDate))

    const applications = await prisma.application.findMany({
      where: {
        createdAt: {
          gte: snapshotStart,
          lt: snapshotEndExclusive,
        },
      },
      select: {
        submittedByName: true,
        submittedBy: true,
        candidate: {
          select: {
            recruiter: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const counts = new Map<string, number>()
    for (const application of applications) {
      const submitterName = application.submittedByName?.trim() || application.submittedBy?.trim() || application.candidate.recruiter.name.trim()
      if (!submitterName) {
        continue
      }
      counts.set(submitterName, (counts.get(submitterName) ?? 0) + 1)
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  } catch (error) {
    console.error("[dashboard-charts] getCandidateSubmissionLeaderboard failed:", error)
    return []
  }
}

async function getRoundsPerDay(weekStart: Date, weekEnd: Date): Promise<DailyPoint[]> {
  try {
    const rounds = await prisma.round.findMany({
      where: {
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        date: true,
      },
    })

    const byDate = new Map<string, number>()
    for (const row of rounds) {
      const key = toUtcDateKey(row.date)
      byDate.set(key, (byDate.get(key) ?? 0) + 1)
    }

    return buildUtcDailyRange(weekStart, weekEnd).map((date) => ({
      date,
      count: byDate.get(date) ?? 0,
    }))
  } catch (error) {
    console.error("[dashboard-charts] getRoundsPerDay failed:", error)
    return []
  }
}

async function getPlacementMetrics(weekStart: Date, weekEnd: Date): Promise<PlacementMetrics> {
  try {
    const placedApps = await prisma.application.findMany({
      where: {
        status: "PLACED",
        updatedAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        appliedDate: true,
        updatedAt: true,
      },
    })

    const weekKeys = buildUtcDailyRange(weekStart, weekEnd)
    const placementsByDate = new Map<string, number>()
    const dayBuckets = new Map<string, { totalDays: number; count: number }>()

    let totalDaysToPlacement = 0
    for (const app of placedApps) {
      const placementDateKey = toUtcDateKey(app.updatedAt)
      placementsByDate.set(placementDateKey, (placementsByDate.get(placementDateKey) ?? 0) + 1)

      const msDiff = app.updatedAt.getTime() - app.appliedDate.getTime()
      const days = Math.max(0, Math.round(msDiff / (1000 * 60 * 60 * 24)))
      totalDaysToPlacement += days

      const bucket = dayBuckets.get(placementDateKey)
      if (bucket) {
        bucket.totalDays += days
        bucket.count += 1
      } else {
        dayBuckets.set(placementDateKey, { totalDays: days, count: 1 })
      }
    }

    const placementSeries: DailyPoint[] = weekKeys.map((date) => ({
      date,
      count: placementsByDate.get(date) ?? 0,
    }))

    const avgPlacementTimeSeries: AvgPlacementTimePoint[] = weekKeys.map((date) => {
      const bucket = dayBuckets.get(date)
      const days = bucket && bucket.count > 0 ? Number((bucket.totalDays / bucket.count).toFixed(1)) : 0
      return { date, days }
    })

    const placementsInPeriod = placedApps.length
    const avgTimeToPlacementDays =
      placementsInPeriod > 0 ? Number((totalDaysToPlacement / placementsInPeriod).toFixed(1)) : 0

    return {
      placementSeries,
      avgPlacementTimeSeries,
      avgTimeToPlacementDays,
      placementsInPeriod,
    }
  } catch (error) {
    console.error("[dashboard-charts] getPlacementMetrics failed:", error)
    const weekKeys = buildUtcDailyRange(weekStart, weekEnd)
    return {
      placementSeries: weekKeys.map((date) => ({ date, count: 0 })),
      avgPlacementTimeSeries: weekKeys.map((date) => ({ date, days: 0 })),
      avgTimeToPlacementDays: 0,
      placementsInPeriod: 0,
    }
  }
}

async function getTargetProgress(weekStart: Date, weekEnd: Date): Promise<TargetProgressPoint[]> {
  try {
    const recruiters = await prisma.recruiter.findMany({
      where: {
        role: "RECRUITER",
        createdAt: {
          lt: weekEnd,
        },
      },
      select: {
        name: true,
        weeklyTargets: {
          where: {
            weekStartDate: weekStart,
          },
          select: {
            applicationTarget: true,
          },
        },
        candidates: {
          select: {
            applications: {
              where: {
                createdAt: {
                  gte: weekStart,
                  lt: weekEnd,
                },
              },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return recruiters.map((recruiter) => ({
      name: recruiter.name,
      target: recruiter.weeklyTargets[0]?.applicationTarget ?? 0,
      achieved: recruiter.candidates.reduce((sum, candidate) => sum + candidate.applications.length, 0),
    }))
  } catch (error) {
    console.error("[dashboard-charts] getTargetProgress failed:", error)
    return []
  }
}

async function getCandidatesByStage(asOfDateExclusive: Date): Promise<StageCount[]> {
  try {
    const candidates = await prisma.candidate.findMany({
      where: {
        createdAt: {
          lt: asOfDateExclusive,
        },
      },
      select: {
        status: true,
        applications: {
          where: {
            createdAt: {
              lt: asOfDateExclusive,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            rounds: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                roundStatus: true,
              },
            },
          },
        },
      },
    })

    const bucket = new Map<string, number>()

    for (const candidate of candidates) {
      const latestApplication = candidate.applications[0]
      const latestRound = latestApplication?.rounds[0]
      const stageRaw = latestRound?.roundStatus ?? latestApplication?.status ?? candidate.status
      const stage = toStageLabel(stageRaw)
      bucket.set(stage, (bucket.get(stage) ?? 0) + 1)
    }

    return Array.from(bucket.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error("[dashboard-charts] getCandidatesByStage failed:", error)
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = resolveWeekStartDate(searchParams.get("weekStart"))
  const { start: resolvedWeekStart, end: resolvedWeekEnd } = getUtcWeekRange(weekStart)
  const { snapshotDate, snapshotEndExclusive } = resolveSnapshotWindow(
    resolvedWeekStart,
    resolvedWeekEnd,
    searchParams.get("snapshotDate")
  )

  const [
    employeeCount,
    candidateCount,
    dailyApplications,
    recruiterApplicationCounts,
    candidateSubmissionLeaderboard,
    roundsPerDay,
    targetProgress,
    candidatesByStage,
    placementMetrics,
  ] = await Promise.all([
    prisma.recruiter.count({
      where: {
        role: "RECRUITER",
        createdAt: {
          lt: resolvedWeekEnd,
        },
      },
    }),
    prisma.candidate.count({
      where: {
        createdAt: {
          lt: resolvedWeekEnd,
        },
      },
    }),
    getDailyApplications(resolvedWeekStart, resolvedWeekEnd),
    getRecruiterApplicationCounts(resolvedWeekStart, resolvedWeekEnd),
    getCandidateSubmissionLeaderboard(snapshotDate, snapshotEndExclusive),
    getRoundsPerDay(resolvedWeekStart, resolvedWeekEnd),
    getTargetProgress(resolvedWeekStart, resolvedWeekEnd),
    getCandidatesByStage(resolvedWeekEnd),
    getPlacementMetrics(resolvedWeekStart, resolvedWeekEnd),
  ])

  return NextResponse.json({
    weekStartDate: toUtcDateKey(resolvedWeekStart),
    weekEndDate: toUtcDateKey(new Date(resolvedWeekEnd.getTime() - 24 * 60 * 60 * 1000)),
    snapshotDate,
    employeeCount,
    candidateCount,
    totalPlacements: placementMetrics.placementsInPeriod,
    dailyApplications,
    recruiterApplicationCounts,
    candidateSubmissionLeaderboard,
    roundsPerDay,
    targetProgress,
    candidatesByStage,
    placementSeries: placementMetrics.placementSeries,
    avgPlacementTimeSeries: placementMetrics.avgPlacementTimeSeries,
    avgTimeToPlacementDays: placementMetrics.avgTimeToPlacementDays,
    placementsInPeriod: placementMetrics.placementsInPeriod,
  })
}
