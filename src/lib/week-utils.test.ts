import {
  clampWeekStart,
  formatWeekLabel,
  getMonthWeekSegments,
  getUtcDayRange,
  getUtcWeekRange,
  parseUtcDateKey,
  shiftUtcWeek,
  toUtcDateKey,
} from "./week-utils"

describe("week-utils", () => {
  it("computes Monday-Sunday UTC boundaries", () => {
    const range = getUtcWeekRange(new Date("2026-04-23T16:12:00.000Z"))

    expect(toUtcDateKey(range.start)).toBe("2026-04-20")
    expect(toUtcDateKey(new Date(range.end.getTime() - 24 * 60 * 60 * 1000))).toBe("2026-04-26")
  })

  it("shifts weeks by full 7-day increments", () => {
    const start = parseUtcDateKey("2026-04-20")

    expect(toUtcDateKey(shiftUtcWeek(start, -1))).toBe("2026-04-13")
    expect(toUtcDateKey(shiftUtcWeek(start, 1))).toBe("2026-04-27")
  })

  it("computes UTC day boundaries", () => {
    const range = getUtcDayRange(new Date("2026-04-23T16:12:00.000Z"))

    expect(toUtcDateKey(range.start)).toBe("2026-04-23")
    expect(toUtcDateKey(new Date(range.end.getTime() - 1))).toBe("2026-04-23")
  })

  it("clamps week boundaries", () => {
    const min = parseUtcDateKey("2026-03-09")
    const max = parseUtcDateKey("2026-04-20")

    expect(toUtcDateKey(clampWeekStart(parseUtcDateKey("2026-01-05"), min, max))).toBe("2026-03-09")
    expect(toUtcDateKey(clampWeekStart(parseUtcDateKey("2026-05-04"), min, max))).toBe("2026-04-20")
    expect(toUtcDateKey(clampWeekStart(parseUtcDateKey("2026-04-13"), min, max))).toBe("2026-04-13")
  })

  it("builds month week segments with month-clamped display ranges", () => {
    const febLeap = getMonthWeekSegments(2028, 2)

    expect(febLeap.length).toBeGreaterThan(0)
    expect(toUtcDateKey(febLeap[0].displayStart)).toBe("2028-02-01")
    expect(toUtcDateKey(febLeap[febLeap.length - 1].displayEnd)).toBe("2028-02-29")
  })

  it("formats human-readable week labels", () => {
    expect(formatWeekLabel(parseUtcDateKey("2026-04-20"))).toBe("Week of 20 Apr - 26 Apr, 2026")
  })
})
