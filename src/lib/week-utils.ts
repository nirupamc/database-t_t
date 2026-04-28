export interface DateRange {
  start: Date
  end: Date
}

export interface MonthWeekSegment {
  index: number
  weekStart: Date
  weekEnd: Date
  displayStart: Date
  displayEnd: Date
}

export function toUtcDateKey(value: Date): string {
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, "0")
  const day = String(value.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseUtcDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1))
}

export function getUtcWeekRange(date: Date): DateRange {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay()
  const diffToMonday = (day + 6) % 7
  start.setUTCDate(start.getUTCDate() - diffToMonday)

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 7)

  return { start, end }
}

export function getUtcMonthRange(date: Date): DateRange {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  return { start, end }
}

export function shiftUtcWeek(weekStart: Date, offsetWeeks: number): Date {
  const next = new Date(weekStart)
  next.setUTCDate(next.getUTCDate() + offsetWeeks * 7)
  return next
}

export function startOfCurrentUtcWeek(now = new Date()): Date {
  return getUtcWeekRange(now).start
}

export function getUtcDayRange(date: Date): DateRange {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)

  const startLabel = weekStart.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" })
  const endLabel = weekEnd.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" })
  const yearLabel = weekEnd.toLocaleDateString("en-GB", { year: "numeric", timeZone: "UTC" })

  return `Week of ${startLabel} - ${endLabel}, ${yearLabel}`
}

export function clampWeekStart(weekStart: Date, minWeekStart: Date, maxWeekStart: Date): Date {
  if (weekStart < minWeekStart) return minWeekStart
  if (weekStart > maxWeekStart) return maxWeekStart
  return weekStart
}

export function getMonthWeekSegments(year: number, month: number): MonthWeekSegment[] {
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 1))
  const firstWeek = getUtcWeekRange(monthStart)

  const segments: MonthWeekSegment[] = []
  let cursor = new Date(firstWeek.start)
  let index = 1

  while (cursor < monthEnd) {
    const nextWeek = new Date(cursor)
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7)

    const overlapsMonth = nextWeek > monthStart && cursor < monthEnd
    if (overlapsMonth) {
      const displayStart = cursor < monthStart ? monthStart : new Date(cursor)
      const displayEndRaw = new Date(nextWeek)
      displayEndRaw.setUTCDate(displayEndRaw.getUTCDate() - 1)
      const lastDayOfMonth = new Date(monthEnd)
      lastDayOfMonth.setUTCDate(lastDayOfMonth.getUTCDate() - 1)
      const displayEnd = displayEndRaw > lastDayOfMonth ? lastDayOfMonth : displayEndRaw

      segments.push({
        index,
        weekStart: new Date(cursor),
        weekEnd: new Date(nextWeek),
        displayStart,
        displayEnd,
      })
      index += 1
    }

    cursor = nextWeek
  }

  return segments
}

export function formatWeekRangeShort(start: Date, end: Date): string {
  const startLabel = start.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" })
  const endLabel = end.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" })
  return `${startLabel}-${endLabel}`
}
