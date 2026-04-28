import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatWeekLabel, getUtcMonthRange, getUtcWeekRange, toUtcDateKey } from "@/lib/week-utils"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const monthAnchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthRange = getUtcMonthRange(monthAnchor)
  const weekRange = getUtcWeekRange(now)

  const month = monthAnchor.getUTCMonth() + 1
  const year = monthAnchor.getUTCFullYear()

  const [monthlyTarget, weeklyTarget, monthlyApps, monthlyPlacements, weeklyApps, weeklyPlacements] = await Promise.all([
    prisma.recruiterTarget.findUnique({
      where: {
        recruiterId_month_year: {
          recruiterId: session.user.id,
          month,
          year,
        },
      },
    }),
    prisma.recruiterWeeklyTarget.findUnique({
      where: {
        recruiterId_weekStartDate: {
          recruiterId: session.user.id,
          weekStartDate: weekRange.start,
        },
      },
    }),
    prisma.application.count({
      where: {
        createdAt: { gte: monthRange.start, lt: monthRange.end },
        candidate: { recruiterId: session.user.id },
      },
    }),
    prisma.application.count({
      where: {
        createdAt: { gte: monthRange.start, lt: monthRange.end },
        status: "PLACED",
        candidate: { recruiterId: session.user.id },
      },
    }),
    prisma.application.count({
      where: {
        createdAt: { gte: weekRange.start, lt: weekRange.end },
        candidate: { recruiterId: session.user.id },
      },
    }),
    prisma.application.count({
      where: {
        createdAt: { gte: weekRange.start, lt: weekRange.end },
        status: "PLACED",
        candidate: { recruiterId: session.user.id },
      },
    }),
  ])

  const monthLabel = monthAnchor.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })

  return NextResponse.json({
    monthLabel,
    weekLabel: formatWeekLabel(weekRange.start),
    weekStartDate: toUtcDateKey(weekRange.start),
    monthly: {
      target: monthlyTarget
        ? {
            applications: monthlyTarget.applicationTarget,
            placements: monthlyTarget.placementTarget,
          }
        : null,
      actual: {
        applications: monthlyApps,
        placements: monthlyPlacements,
      },
    },
    weekly: {
      target: weeklyTarget
        ? {
            applications: weeklyTarget.applicationTarget,
            placements: weeklyTarget.placementTarget,
          }
        : null,
      actual: {
        applications: weeklyApps,
        placements: weeklyPlacements,
      },
    },
  })
}
