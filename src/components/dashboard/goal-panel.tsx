"use client"

import { useEffect, useMemo, useState } from "react"

import { DASHBOARD_REFRESH_INTERVAL_MS } from "@/lib/constants"
import { Progress } from "@/components/ui/progress"

type TargetPayload = {
  monthLabel: string
  weekLabel: string
  weekStartDate: string
  monthly: {
    target: { applications: number | null; placements: number | null } | null
    actual: { applications: number; placements: number }
  }
  weekly: {
    target: { applications: number | null; placements: number | null } | null
    actual: { applications: number; placements: number }
  }
}

function pct(actual: number, target: number | null | undefined) {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((actual / target) * 100))
}

export function GoalPanel() {
  const [data, setData] = useState<TargetPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch("/api/dashboard/my-target", { cache: "no-store" })
        if (!response.ok) return
        const payload = (await response.json()) as TargetPayload
        if (active) {
          setData(payload)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()
    const intervalId = window.setInterval(load, DASHBOARD_REFRESH_INTERVAL_MS)
    const onFocus = () => {
      load()
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [])

  const compactText = useMemo(() => {
    if (loading) return "Loading target..."
    if (!data) return "No target set for this period."

    const hasMonthly = !!data.monthly.target
    const hasWeekly = !!data.weekly.target

    if (!hasMonthly && !hasWeekly) {
      return "No target set for this period."
    }

    if (!hasMonthly) {
      return `${pct(data.weekly.actual.applications, data.weekly.target?.applications)}% of weekly apps target met`
    }

    return `${pct(data.monthly.actual.applications, data.monthly.target?.applications)}% of monthly apps target met`
  }, [data, loading])

  const monthlyAppsPct = pct(data?.monthly.actual.applications ?? 0, data?.monthly.target?.applications)
  const monthlyPlacementsPct = pct(data?.monthly.actual.placements ?? 0, data?.monthly.target?.placements)
  const weeklyAppsPct = pct(data?.weekly.actual.applications ?? 0, data?.weekly.target?.applications)
  const weeklyPlacementsPct = pct(data?.weekly.actual.placements ?? 0, data?.weekly.target?.placements)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 lg:left-70 w-56 rounded-xl border bg-card p-4 text-left shadow-lg"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Current Goal</p>
        <p className="text-xs text-muted-foreground">{compactText}</p>
      </button>

      {open && <button type="button" className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} aria-label="Dismiss target panel" />}

      {open && (
        <div className="fixed bottom-6 left-6 z-50 w-90 max-w-[92vw] rounded-xl border border-border bg-card p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Target Progress</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>

          {!data && <p className="text-sm text-muted-foreground">No target set for this period.</p>}

          {data && (
            <div className="space-y-5">
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">This Month&apos;s Target • {data.monthLabel}</p>
                {!data.monthly.target && <p className="text-sm text-muted-foreground">No monthly target set.</p>}
                {data.monthly.target && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Applications</span>
                        <span>{data.monthly.actual.applications}/{data.monthly.target.applications ?? 0} ({monthlyAppsPct}%)</span>
                      </div>
                      <Progress value={monthlyAppsPct} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Placements</span>
                        <span>{data.monthly.actual.placements}/{data.monthly.target.placements ?? 0} ({monthlyPlacementsPct}%)</span>
                      </div>
                      <Progress value={monthlyPlacementsPct} className="h-2" />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">This Week&apos;s Target • {data.weekLabel}</p>
                {!data.weekly.target && <p className="text-sm text-muted-foreground">No weekly target set.</p>}
                {data.weekly.target && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Applications</span>
                        <span>{data.weekly.actual.applications}/{data.weekly.target.applications ?? 0} ({weeklyAppsPct}%)</span>
                      </div>
                      <Progress value={weeklyAppsPct} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Placements</span>
                        <span>{data.weekly.actual.placements}/{data.weekly.target.placements ?? 0} ({weeklyPlacementsPct}%)</span>
                      </div>
                      <Progress value={weeklyPlacementsPct} className="h-2" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
