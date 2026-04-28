import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getTargetsAction } from "@/actions/targets"
import { AdminTargetsPage } from "@/components/admin/targets/admin-targets-page"
import { APP_LAUNCH_DATE } from "@/lib/constants"
import { clampWeekStart, getUtcWeekRange, startOfCurrentUtcWeek, toUtcDateKey } from "@/lib/week-utils"

export default async function TargetsRoute({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; view?: string; weekStart?: string }>;
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role.toUpperCase() !== "ADMIN") {
    redirect("/dashboard")
  }

  const now = new Date()
  const params = await searchParams
  const rawMonth = params.month ? Number(params.month) : now.getMonth() + 1
  const rawYear = params.year ? Number(params.year) : now.getFullYear()
  const currentMonth = Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1
  const currentYear = Number.isFinite(rawYear) && rawYear >= 2024 ? rawYear : now.getFullYear()

  const minWeekStart = getUtcWeekRange(APP_LAUNCH_DATE).start
  const maxWeekStart = startOfCurrentUtcWeek()
  const requestedWeekStart = params.weekStart
    ? new Date(`${params.weekStart}T00:00:00.000Z`)
    : getUtcWeekRange(new Date(Date.UTC(currentYear, currentMonth - 1, 1))).start
  const clampedWeekStart = clampWeekStart(requestedWeekStart, minWeekStart, maxWeekStart)

  const view = params.view === "week" ? "week" : "month"

  const data = await getTargetsAction({
    month: currentMonth,
    year: currentYear,
    view,
    weekStartDate: toUtcDateKey(clampedWeekStart),
  })

  return (
    <AdminTargetsPage
      recruiters={data}
      currentMonth={currentMonth}
      currentYear={currentYear}
      view={view}
      weekStartDate={toUtcDateKey(clampedWeekStart)}
    />
  )
}