'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { setRecruiterTargetAction } from "@/actions/targets"
import { APP_LAUNCH_DATE } from "@/lib/constants"
import {
  clampWeekStart,
  formatWeekLabel,
  formatWeekRangeShort,
  getMonthWeekSegments,
  getUtcWeekRange,
  parseUtcDateKey,
  shiftUtcWeek,
  startOfCurrentUtcWeek,
  toUtcDateKey,
} from "@/lib/week-utils"

type WeeklyTargetValue = {
  weekStartDate: string
  applicationTarget: number | null
  placementTarget: number | null
}

type RecruiterTargetRow = {
  id: string
  name: string
  email: string
  profilePhotoUrl: string | null
  target: {
    id: string
    recruiterId: string
    month: number
    year: number
    applicationTarget: number
    placementTarget: number
    createdAt: Date
    updatedAt: Date
  } | null
  weeklyTarget: {
    id: string
    recruiterId: string
    weekStartDate: Date
    year: number
    weekNumber: number
    applicationTarget: number | null
    placementTarget: number | null
    createdAt: Date
    updatedAt: Date
  } | null
  weeklyTargets: WeeklyTargetValue[]
  view: "month" | "week"
  activeApplicationTarget: number | null
  activePlacementTarget: number | null
  applicationsCount: number
  placementsCount: number
  applicationProgress: number
  placementProgress: number
  applicationsMet: boolean
  placementsMet: boolean
}

interface AdminTargetsPageProps {
  recruiters: RecruiterTargetRow[]
  currentMonth: number
  currentYear: number
  view: "month" | "week"
  weekStartDate: string
}

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
]

const yearOptions = [2025, 2026, 2027]

type WeeklyDraftRow = {
  weekStartDate: string
  applicationTarget: string
  placementTarget: string
}

export function AdminTargetsPage({ recruiters, currentMonth, currentYear, view, weekStartDate }: AdminTargetsPageProps) {
  const router = useRouter()

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedView, setSelectedView] = useState<"month" | "week">(view)
  const [selectedWeekStart, setSelectedWeekStart] = useState(parseUtcDateKey(weekStartDate))

  const [editingTarget, setEditingTarget] = useState<RecruiterTargetRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showWeeklySection, setShowWeeklySection] = useState(false)
  const [removedWeekStarts, setRemovedWeekStarts] = useState<string[]>([])
  const [targetForm, setTargetForm] = useState({ applicationTarget: 0, placementTarget: 0 })
  const [weeklyRows, setWeeklyRows] = useState<WeeklyDraftRow[]>([])

  const minWeekStart = useMemo(() => getUtcWeekRange(APP_LAUNCH_DATE).start, [])
  const maxWeekStart = useMemo(() => startOfCurrentUtcWeek(), [])

  const totalRecruitersWithTargets = recruiters.filter((recruiter) => {
    if (selectedView === "week") return recruiter.weeklyTarget !== null
    return recruiter.target !== null
  }).length

  const targetsMetApplications = recruiters.filter((recruiter) => recruiter.applicationsMet).length
  const targetsMetPlacements = recruiters.filter((recruiter) => recruiter.placementsMet).length
  const totalApplications = recruiters.reduce((sum, recruiter) => sum + recruiter.applicationsCount, 0)

  const currentMonthLabel = useMemo(() => months[selectedMonth - 1], [selectedMonth])
  const monthWeekSegments = useMemo(() => getMonthWeekSegments(selectedYear, selectedMonth), [selectedMonth, selectedYear])

  const navigateToPeriod = (next: {
    month: number
    year: number
    view: "month" | "week"
    weekStartDate: Date
  }) => {
    const params = new URLSearchParams()
    params.set("month", String(next.month))
    params.set("year", String(next.year))
    params.set("view", next.view)
    params.set("weekStart", toUtcDateKey(next.weekStartDate))
    router.push(`/admin/targets?${params.toString()}`)
  }

  const openTargetEditor = (recruiter: RecruiterTargetRow) => {
    setEditingTarget(recruiter)
    setShowWeeklySection(false)
    setRemovedWeekStarts([])
    setTargetForm({
      applicationTarget: recruiter.target?.applicationTarget ?? 0,
      placementTarget: recruiter.target?.placementTarget ?? 0,
    })

    const prefilledRows = monthWeekSegments
      .map((segment) => {
        const existing = recruiter.weeklyTargets.find((item) => item.weekStartDate === toUtcDateKey(segment.weekStart))
        if (!existing) return null

        return {
          weekStartDate: existing.weekStartDate,
          applicationTarget: existing.applicationTarget == null ? "" : String(existing.applicationTarget),
          placementTarget: existing.placementTarget == null ? "" : String(existing.placementTarget),
        }
      })
      .filter((row): row is WeeklyDraftRow => row !== null)

    setWeeklyRows(prefilledRows)
  }

  const addNextWeekRow = () => {
    const usedWeekStarts = new Set(weeklyRows.map((row) => row.weekStartDate))
    const nextSegment = monthWeekSegments.find((segment) => !usedWeekStarts.has(toUtcDateKey(segment.weekStart)))
    if (!nextSegment) return

    setWeeklyRows((prev) => [
      ...prev,
      {
        weekStartDate: toUtcDateKey(nextSegment.weekStart),
        applicationTarget: "",
        placementTarget: "",
      },
    ])
  }

  const removeWeeklyRow = (weekStart: string) => {
    setWeeklyRows((prev) => prev.filter((row) => row.weekStartDate !== weekStart))
    setRemovedWeekStarts((prev) => (prev.includes(weekStart) ? prev : [...prev, weekStart]))
  }

  const handleSaveTarget = async () => {
    if (!editingTarget) return

    const updates = weeklyRows
      .map((row) => {
        const applicationTarget = row.applicationTarget.trim() === "" ? null : Number(row.applicationTarget)
        const placementTarget = row.placementTarget.trim() === "" ? null : Number(row.placementTarget)

        if (applicationTarget == null && placementTarget == null) {
          return null
        }

        return {
          weekStartDate: row.weekStartDate,
          applicationTarget,
          placementTarget,
        }
      })
      .filter((item): item is { weekStartDate: string; applicationTarget: number | null; placementTarget: number | null } => item !== null)

    const removals = removedWeekStarts.map((week) => ({
      weekStartDate: week,
      applicationTarget: null,
      placementTarget: null,
    }))

    setIsSaving(true)
    try {
      await setRecruiterTargetAction({
        recruiterId: editingTarget.id,
        month: selectedMonth,
        year: selectedYear,
        applicationTarget: targetForm.applicationTarget,
        placementTarget: targetForm.placementTarget,
        weeklyTargets: [...updates, ...removals],
      })
      toast.success(`Target saved for ${editingTarget.name}`)
      setEditingTarget(null)
      router.refresh()
    } catch (error) {
      console.error("[AdminTargets] save failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save target")
    } finally {
      setIsSaving(false)
    }
  }

  const setView = (nextView: "month" | "week") => {
    setSelectedView(nextView)
    navigateToPeriod({
      month: selectedMonth,
      year: selectedYear,
      view: nextView,
      weekStartDate: selectedWeekStart,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">Recruiter Targets</h1>
          <p className="text-muted-foreground">Set and monitor recruiter goals for monthly and weekly periods.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-background p-1 text-sm">
            <button
              type="button"
              onClick={() => setView("month")}
              className={`rounded-md px-3 py-1.5 transition-colors ${selectedView === "month" ? "bg-yellow-400 text-black font-semibold" : "text-muted-foreground"}`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={`rounded-md px-3 py-1.5 transition-colors ${selectedView === "week" ? "bg-yellow-400 text-black font-semibold" : "text-muted-foreground"}`}
            >
              Week View
            </button>
          </div>

          {selectedView === "month" ? (
            <>
              <select
                value={selectedMonth}
                onChange={(event) => {
                  const nextMonth = Number(event.target.value)
                  setSelectedMonth(nextMonth)
                  navigateToPeriod({
                    month: nextMonth,
                    year: selectedYear,
                    view: selectedView,
                    weekStartDate: selectedWeekStart,
                  })
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(event) => {
                  const nextYear = Number(event.target.value)
                  setSelectedYear(nextYear)
                  navigateToPeriod({
                    month: selectedMonth,
                    year: nextYear,
                    view: selectedView,
                    weekStartDate: selectedWeekStart,
                  })
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = clampWeekStart(shiftUtcWeek(selectedWeekStart, -1), minWeekStart, maxWeekStart)
                  setSelectedWeekStart(next)
                  navigateToPeriod({
                    month: selectedMonth,
                    year: selectedYear,
                    view: selectedView,
                    weekStartDate: next,
                  })
                }}
                disabled={selectedWeekStart.getTime() === minWeekStart.getTime()}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium min-w-55 text-center">{formatWeekLabel(selectedWeekStart)}</p>
              <button
                type="button"
                onClick={() => {
                  const next = clampWeekStart(shiftUtcWeek(selectedWeekStart, 1), minWeekStart, maxWeekStart)
                  setSelectedWeekStart(next)
                  navigateToPeriod({
                    month: selectedMonth,
                    year: selectedYear,
                    view: selectedView,
                    weekStartDate: next,
                  })
                }}
                disabled={selectedWeekStart.getTime() === maxWeekStart.getTime()}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Recruiters with Targets", value: totalRecruitersWithTargets, icon: "🎯" },
          { label: "Targets Met (Applications)", value: targetsMetApplications, icon: "✅" },
          { label: "Targets Met (Placements)", value: targetsMetPlacements, icon: "🏆" },
          { label: selectedView === "week" ? "Total Applications (Week)" : "Total Applications (Month)", value: totalApplications, icon: "📄" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border p-4">
            <div className="mb-1 flex items-center gap-2">
              <span>{stat.icon}</span>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-2xl font-black text-yellow-400">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {recruiters.map((recruiter) => (
          <div key={recruiter.id} className="space-y-4 rounded-xl border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400/20 text-sm font-bold text-yellow-400">
                  {recruiter.name.split(" ").map((part) => part[0]).join("").substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold">{recruiter.name}</p>
                  <p className="text-xs text-muted-foreground">{recruiter.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openTargetEditor(recruiter)}
                className="rounded-lg border border-yellow-400 px-3 py-1.5 text-xs text-yellow-400 transition-colors hover:bg-yellow-400/10"
              >
                {(selectedView === "week" ? recruiter.weeklyTarget : recruiter.target) ? "Edit Target" : "Set Target"}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{selectedView === "week" ? "Weekly Applications" : "Monthly Applications"}</span>
                <span className="font-semibold">
                  {recruiter.applicationsCount}
                  {recruiter.activeApplicationTarget != null && <span className="font-normal text-muted-foreground">/{recruiter.activeApplicationTarget}</span>}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-border">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${recruiter.applicationsMet ? "bg-green-500" : "bg-yellow-400"}`}
                  style={{ width: `${recruiter.applicationProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{recruiter.applicationProgress}% complete</span>
                {recruiter.applicationsMet && <span className="font-medium text-green-500">Target Met</span>}
                {recruiter.activeApplicationTarget == null && <span className="text-yellow-400">No target set</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{selectedView === "week" ? "Weekly Placements" : "Monthly Placements"}</span>
                <span className="font-semibold">
                  {recruiter.placementsCount}
                  {recruiter.activePlacementTarget != null && <span className="font-normal text-muted-foreground">/{recruiter.activePlacementTarget}</span>}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-border">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${recruiter.placementsMet ? "bg-green-500" : "bg-yellow-400"}`}
                  style={{ width: `${recruiter.placementProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{recruiter.placementProgress}% complete</span>
                {recruiter.placementsMet && <span className="font-medium text-green-500">Target Met</span>}
                {recruiter.activePlacementTarget == null && <span className="text-yellow-400">No target set</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl space-y-4 rounded-xl border border-border bg-background p-6">
            <h3 className="text-lg font-bold">Set Target for {editingTarget.name}</h3>
            <p className="text-sm text-muted-foreground">{currentMonthLabel} {selectedYear}</p>

            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-yellow-400">Monthly Target ({currentMonthLabel})</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Applications Target</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={targetForm.applicationTarget}
                    onChange={(event) => setTargetForm((prev) => ({ ...prev, applicationTarget: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400"
                    placeholder="e.g. 20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Placements Target</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={targetForm.placementTarget}
                    onChange={(event) => setTargetForm((prev) => ({ ...prev, placementTarget: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400"
                    placeholder="e.g. 3"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setShowWeeklySection((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold uppercase tracking-wide text-yellow-400">Weekly Targets</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showWeeklySection ? "rotate-180" : ""}`} />
              </button>

              {showWeeklySection && (
                <div className="space-y-3 border-t border-border p-4">
                  {weeklyRows.map((row, index) => {
                    const segment = monthWeekSegments.find((item) => toUtcDateKey(item.weekStart) === row.weekStartDate)
                    const label = segment
                      ? `Week ${index + 1}: ${formatWeekRangeShort(segment.displayStart, segment.displayEnd)}`
                      : `Week ${index + 1}`

                    return (
                      <div key={row.weekStartDate} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                        <div className="flex items-center text-sm text-muted-foreground">{label}</div>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={row.applicationTarget}
                          onChange={(event) => {
                            const value = event.target.value
                            setWeeklyRows((prev) => prev.map((item) => item.weekStartDate === row.weekStartDate ? { ...item, applicationTarget: value } : item))
                          }}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400"
                          placeholder="Applications Target"
                        />
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={row.placementTarget}
                          onChange={(event) => {
                            const value = event.target.value
                            setWeeklyRows((prev) => prev.map((item) => item.weekStartDate === row.weekStartDate ? { ...item, placementTarget: value } : item))
                          }}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400"
                          placeholder="Placements Target"
                        />
                        <button
                          type="button"
                          onClick={() => removeWeeklyRow(row.weekStartDate)}
                          className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={addNextWeekRow}
                    disabled={weeklyRows.length >= Math.min(4, monthWeekSegments.length)}
                    className="rounded-lg border border-yellow-400 px-3 py-2 text-sm text-yellow-400 transition-colors hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Add Next Week Target
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-yellow-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                disabled={isSaving}
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-500 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Target"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
