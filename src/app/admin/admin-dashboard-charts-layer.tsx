"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react"

import { APP_LAUNCH_DATE, DASHBOARD_REFRESH_INTERVAL_MS } from "@/lib/constants"
import {
  clampWeekStart,
  formatWeekLabel,
  getUtcWeekRange,
  parseUtcDateKey,
  shiftUtcWeek,
  startOfCurrentUtcWeek,
  toUtcDateKey,
} from "@/lib/week-utils"

const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false })
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false })
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false })
const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false })
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false })
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false })
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false })
const ZAxis = dynamic(() => import("recharts").then((mod) => mod.ZAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false })
const ReferenceLine = dynamic(() => import("recharts").then((mod) => mod.ReferenceLine), { ssr: false })
const ScatterChart = dynamic(() => import("recharts").then((mod) => mod.ScatterChart), { ssr: false })
const Scatter = dynamic(() => import("recharts").then((mod) => mod.Scatter), { ssr: false })

type DailyPoint = { date: string; count: number }
type AvgPlacementTimePoint = { date: string; days: number }
type RecruiterPoint = { name: string; count: number }
type CandidateLeaderboardPoint = { name: string; count: number }
type BubblePoint = CandidateLeaderboardPoint & { rank: number; x: number; y: number; size: number; fill: string }
type TargetPoint = { name: string; target: number; achieved: number }
type StagePoint = { stage: string; count: number }

interface DashboardChartPayload {
  weekStartDate: string
  weekEndDate: string
  employeeCount: number
  candidateCount: number
  totalPlacements: number
  snapshotDate: string
  dailyApplications: DailyPoint[]
  placementSeries: DailyPoint[]
  avgPlacementTimeSeries: AvgPlacementTimePoint[]
  avgTimeToPlacementDays: number
  placementsInPeriod: number
  recruiterApplicationCounts: RecruiterPoint[]
  candidateSubmissionLeaderboard: CandidateLeaderboardPoint[]
  roundsPerDay: DailyPoint[]
  targetProgress: TargetPoint[]
  candidatesByStage: StagePoint[]
}

type PopupKey =
  | "employees"
  | "candidates"
  | "placements"
  | "avg-apps"
  | "conversion"
  | "avg-time"
  | "rounds-week"
  | "apps-week"
  | "target"
  | "candidate-leaderboard"
  | "leaderboard"
  | null

interface DashboardWeekContextValue {
  weekStart: Date
  setWeekStart: (next: Date) => void
  minWeekStart: Date
  maxWeekStart: Date
}

const DashboardWeekContext = createContext<DashboardWeekContextValue | null>(null)

function useDashboardWeek() {
  const context = useContext(DashboardWeekContext)
  if (!context) {
    throw new Error("useDashboardWeek must be used inside DashboardWeekContext")
  }
  return context
}

const PIE_COLORS = ["#22d3ee", "#f59e0b", "#34d399", "#f43f5e", "#a78bfa", "#60a5fa", "#f97316"]

function getTrophyColor(index: number) {
  if (index === 0) return "text-yellow-400"
  if (index === 1) return "text-slate-300"
  if (index === 2) return "text-amber-600"
  return "text-slate-500"
}

function toShortDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" })
}

function toWeekday(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)
  return date.toLocaleDateString("en-GB", { weekday: "short" })
}

function firstName(value: string) {
  return value.split(" ")[0] ?? value
}

function bubbleSize(count: number) {
  return Math.max(1, count)
}

function WeekHeader() {
  const { weekStart, setWeekStart, minWeekStart, maxWeekStart } = useDashboardWeek()
  const weekLabel = formatWeekLabel(weekStart)
  const isMinWeek = weekStart.getTime() === minWeekStart.getTime()
  const isMaxWeek = weekStart.getTime() === maxWeekStart.getTime()

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-4">
      <button
        type="button"
        onClick={() => setWeekStart(shiftUtcWeek(weekStart, -1))}
        disabled={isMinWeek}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2a2d3a] bg-[#242730] text-foreground transition-colors hover:bg-[#2a2d3a] disabled:cursor-not-allowed disabled:opacity-50"
        title="Previous week"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex-1 text-center">
        <p className="text-lg font-semibold text-foreground">{weekLabel}</p>
        <p className="text-xs text-muted-foreground">Monday-Sunday (UTC)</p>
      </div>
      <button
        type="button"
        onClick={() => setWeekStart(shiftUtcWeek(weekStart, 1))}
        disabled={isMaxWeek}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2a2d3a] bg-[#242730] text-foreground transition-colors hover:bg-[#2a2d3a] disabled:cursor-not-allowed disabled:opacity-50"
        title="Next week"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

export function AdminDashboardChartsLayer() {
  const minWeekStart = useMemo(() => getUtcWeekRange(APP_LAUNCH_DATE).start, [])
  const maxWeekStart = useMemo(() => startOfCurrentUtcWeek(), [])

  const [weekStart, setWeekStartState] = useState<Date>(maxWeekStart)
  const [chartData, setChartData] = useState<DashboardChartPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [popupKey, setPopupKey] = useState<PopupKey>(null)
  const [popupWeekByKey, setPopupWeekByKey] = useState<Partial<Record<Exclude<PopupKey, null>, string>>>({})
  const [popupData, setPopupData] = useState<DashboardChartPayload | null>(null)
  const [popupLoading, setPopupLoading] = useState(false)

  const setWeekStart = useCallback(
    (next: Date) => {
      setWeekStartState(clampWeekStart(next, minWeekStart, maxWeekStart))
    },
    [maxWeekStart, minWeekStart]
  )

  const loadCharts = useCallback(async (date: Date) => {
    const weekKey = toUtcDateKey(date)
    const response = await fetch(`/api/admin/dashboard-charts?weekStart=${weekKey}`, { cache: "no-store" })
    if (!response.ok) {
      throw new Error("Failed to load dashboard charts")
    }
    return (await response.json()) as DashboardChartPayload
  }, [])

  useEffect(() => {
    let active = true
    async function run() {
      try {
        setIsLoading(true)
        const data = await loadCharts(weekStart)
        if (!active) return
        setChartData(data)
        setLoadError(null)
      } catch {
        if (!active) return
        setLoadError("Failed to load KPI data")
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    run()

    const intervalId = window.setInterval(run, DASHBOARD_REFRESH_INTERVAL_MS)
    const onFocus = () => {
      run()
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [loadCharts, weekStart])

  const popupWeekStart = useMemo(() => {
    if (!popupKey) return null
    const weekKey = popupWeekByKey[popupKey]
    return weekKey ? parseUtcDateKey(weekKey) : weekStart
  }, [popupKey, popupWeekByKey, weekStart])

  useEffect(() => {
    if (!popupKey || !popupWeekStart) {
      return
    }

    let active = true
    async function run() {
      try {
        setPopupLoading(true)
        const data = await loadCharts(popupWeekStart)
        if (!active) return
        setPopupData(data)
      } catch {
        if (!active) return
        setPopupData(null)
      } finally {
        if (active) {
          setPopupLoading(false)
        }
      }
    }

    run()
    return () => {
      active = false
    }
  }, [loadCharts, popupKey, popupWeekStart])

  const openPopup = (key: Exclude<PopupKey, null>) => {
    setPopupWeekByKey((prev) => {
      if (prev[key]) return prev
      return { ...prev, [key]: toUtcDateKey(weekStart) }
    })
    setPopupKey(key)
  }

  const activeData = chartData
  const totals = useMemo(() => {
    if (!activeData) {
      return {
        totalApps: 0,
        roundsWeek: 0,
        totalTarget: 0,
        totalAchieved: 0,
      }
    }

    const totalApps = activeData.dailyApplications.reduce((sum, point) => sum + point.count, 0)
    const roundsWeek = activeData.roundsPerDay.reduce((sum, point) => sum + point.count, 0)
    const totalTarget = activeData.targetProgress.reduce((sum, point) => sum + point.target, 0)
    const totalAchieved = activeData.targetProgress.reduce((sum, point) => sum + point.achieved, 0)

    return {
      totalApps,
      roundsWeek,
      totalTarget,
      totalAchieved,
    }
  }, [activeData])

  const leaderboardData = useMemo(() => {
    if (!activeData) return []
    return [...activeData.recruiterApplicationCounts].sort((a, b) => b.count - a.count)
  }, [activeData])

  const candidateLeaderboardData = useMemo(() => {
    if (!activeData) return []
    return [...activeData.candidateSubmissionLeaderboard].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [activeData])

  const candidateLeaderboardBubbleData = useMemo<BubblePoint[]>(() => {
    return candidateLeaderboardData.slice(0, 8).map((point, index) => ({
      ...point,
      rank: index + 1,
      x: index + 1,
      y: point.count,
      size: bubbleSize(point.count),
      fill: PIE_COLORS[index % PIE_COLORS.length],
    }))
  }, [candidateLeaderboardData])

  const candidateLeaderboardPeak = candidateLeaderboardData[0]
  const candidateLeaderboardTotal = useMemo(
    () => candidateLeaderboardData.reduce((sum, point) => sum + point.count, 0),
    [candidateLeaderboardData]
  )

  const averageDailyApps = useMemo(() => {
    if (!activeData || activeData.dailyApplications.length === 0) return 0
    const total = activeData.dailyApplications.reduce((sum, point) => sum + point.count, 0)
    return Number((total / activeData.dailyApplications.length).toFixed(2))
  }, [activeData])

  const snapshotDateLabel = activeData ? toShortDate(activeData.snapshotDate) : ""

  const topCards = useMemo(
    () => [
      {
        key: "avg-apps" as const,
        title: "Avg applications / recruiter",
        value:
          activeData && activeData.recruiterApplicationCounts.length > 0
            ? Math.round(totals.totalApps / activeData.recruiterApplicationCounts.length)
            : 0,
        subtitle: "Selected week",
      },
      {
        key: "conversion" as const,
        title: "Conversion rate",
        value: totals.totalApps > 0 && activeData ? `${Math.round((activeData.totalPlacements / totals.totalApps) * 100)}%` : "0%",
        subtitle: "Placements vs applications",
      },
      {
        key: "avg-time" as const,
        title: "Avg time-to-placement",
        value: `${activeData?.avgTimeToPlacementDays ?? 0} days`,
        subtitle: "Placed applications in week",
      },
      {
        key: "rounds-week" as const,
        title: "Rounds scheduled this week",
        value: totals.roundsWeek,
        subtitle: "Mon-Sun (UTC)",
      },
      {
        key: "apps-week" as const,
        title: "Applications this week",
        value: totals.totalApps,
        subtitle: "Mon-Sun (UTC)",
      },
      {
        key: "target" as const,
        title: "Target completion %",
        value: totals.totalTarget > 0 ? `${Math.round((totals.totalAchieved / totals.totalTarget) * 100)}%` : "0%",
        subtitle: "Weekly target achieved",
      },
    ],
    [activeData, totals]
  )

  const contextValue = useMemo(
    () => ({
      weekStart,
      setWeekStart,
      minWeekStart,
      maxWeekStart,
    }),
    [maxWeekStart, minWeekStart, setWeekStart, weekStart]
  )

  return (
    <DashboardWeekContext.Provider value={contextValue}>
      <div className="space-y-6">
        <WeekHeader />

        {isLoading && <p className="text-sm text-muted-foreground">Loading KPI data...</p>}
        {loadError && <p className="text-sm text-red-400">{loadError}</p>}

        {activeData && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <button type="button" onClick={() => openPopup("employees")} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 text-left">
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold text-foreground">{activeData.employeeCount}</p>
                <div className="mt-3 h-15 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeData.recruiterApplicationCounts}>
                      <Bar dataKey="count" fill="#f5c842" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </button>

              <button type="button" onClick={() => openPopup("candidates")} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 text-left">
                <p className="text-xs text-muted-foreground">Candidates</p>
                <p className="text-2xl font-bold text-foreground">{activeData.candidateCount}</p>
                <div className="mt-3 h-15 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeData.candidatesByStage}>
                      <Bar dataKey="count" fill="#5bc4f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </button>

              <button type="button" onClick={() => openPopup("placements")} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 text-left">
                <p className="text-xs text-muted-foreground">Placements</p>
                <p className="text-2xl font-bold text-foreground">{activeData.totalPlacements}</p>
                <div className="mt-3 h-15 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeData.placementSeries}>
                      <Line dataKey="count" stroke="#6fcf80" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topCards.map((card) => (
                <button key={card.key} type="button" onClick={() => openPopup(card.key)} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 text-left">
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>

                  <div className="mt-3 h-15 overflow-hidden">
                    {card.key === "avg-apps" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeData.recruiterApplicationCounts}>
                          <Bar dataKey="count" fill="#f5c842" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {card.key === "conversion" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ label: "W", applications: totals.totalApps, placements: activeData.totalPlacements }]}> 
                          <Bar dataKey="placements" fill="#6fcf80" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {card.key === "avg-time" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeData.avgPlacementTimeSeries}>
                          <Line dataKey="days" stroke="#9f7aea" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}

                    {card.key === "rounds-week" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeData.roundsPerDay}>
                          <Bar dataKey="count" fill="#5bc4f0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {card.key === "apps-week" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeData.dailyApplications}>
                          <Bar dataKey="count" fill="#9f7aea" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {card.key === "target" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeData.targetProgress}>
                          <Bar dataKey="target" fill="#2a2d3a" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="achieved" fill="#f5c842" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button type="button" onClick={() => openPopup("candidate-leaderboard")} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 text-left">
                <p className="text-xs text-muted-foreground">Employee submissions today</p>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{candidateLeaderboardPeak?.name ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {candidateLeaderboardPeak ? `${candidateLeaderboardPeak.count} submissions` : "No submissions"}
                      {snapshotDateLabel ? ` • As of ${snapshotDateLabel}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#2a2d3a] bg-[#111827] px-3 py-1 text-xs font-medium text-cyan-300">
                    {candidateLeaderboardData.length} ranked
                  </span>
                </div>
                <div className="mt-3 flex h-20 gap-3 overflow-hidden">
                  <div className="h-full w-24 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                        <XAxis dataKey="x" type="number" hide domain={[1, Math.max(candidateLeaderboardBubbleData.length, 1)]} />
                        <YAxis dataKey="y" type="number" hide domain={[0, Math.max(candidateLeaderboardPeak?.count ?? 1, 1)]} />
                        <ZAxis dataKey="size" range={[80, 260]} />
                        <Scatter data={candidateLeaderboardBubbleData}>
                          {candidateLeaderboardBubbleData.map((point) => (
                            <Cell key={point.name} fill={point.fill} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-muted-foreground">Resets daily at midnight UTC</p>
                    {candidateLeaderboardBubbleData.slice(0, 3).map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-md bg-[#111827] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-slate-950" style={{ backgroundColor: item.fill }}>
                            {item.rank}
                          </div>
                          <span className="text-sm text-slate-100">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-cyan-300">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>

              <button type="button" onClick={() => openPopup("leaderboard")} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 text-left">
                <p className="text-xs text-slate-200">Leaderboard</p>
                <p className="text-2xl font-bold text-foreground">{leaderboardData[0]?.name ?? "-"}</p>
                <div className="mt-3 space-y-2">
                  {leaderboardData.slice(0, 4).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between rounded-md bg-[#111827] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Trophy className={`h-4 w-4 ${getTrophyColor(index)}`} />
                        <span className="text-sm text-slate-100">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-cyan-300">{item.count}</span>
                    </div>
                  ))}
                </div>
              </button>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-[#2a2d3a] bg-[#1a1d27] p-5">
              <h3 className="font-semibold text-foreground">Daily application activity</h3>
              <p className="text-sm text-muted-foreground">Applications submitted for the selected week</p>
              <div className="mt-4 h-60 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeData.dailyApplications}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tickFormatter={toShortDate} tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }}
                      labelStyle={{ color: "#f0f0f0" }}
                      formatter={(value: number) => [value, "Applications"]}
                      labelFormatter={(label: string) => new Date(`${label}T00:00:00.000Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    />
                    <ReferenceLine y={averageDailyApps} stroke="#888" strokeDasharray="3 3" label={{ value: "Weekly avg", fill: "#888", position: "insideTopRight" }} />
                    <Area type="monotone" dataKey="count" stroke="#f5c842" fill="#f5c842" fillOpacity={0.12} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {popupKey && popupWeekStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">
                {popupKey === "employees" && "Employees"}
                {popupKey === "candidates" && "Candidates"}
                {popupKey === "placements" && "Placements"}
                {popupKey === "avg-apps" && "Avg applications / recruiter"}
                {popupKey === "conversion" && "Conversion rate"}
                {popupKey === "avg-time" && "Avg time-to-placement"}
                {popupKey === "rounds-week" && "Rounds scheduled this week"}
                {popupKey === "apps-week" && "Applications this week"}
                {popupKey === "target" && "Target completion"}
                {popupKey === "candidate-leaderboard" && "Employee submissions today"}
                {popupKey === "leaderboard" && "Leaderboard"}
              </h3>
              <button type="button" onClick={() => setPopupKey(null)} className="rounded-lg border border-[#2a2d3a] px-3 py-1 text-sm text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>

            <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-[#2a2d3a] bg-[#151824] p-3">
              <button
                type="button"
                onClick={() => {
                  const next = clampWeekStart(shiftUtcWeek(popupWeekStart, -1), minWeekStart, maxWeekStart)
                  setPopupWeekByKey((prev) => ({ ...prev, [popupKey]: toUtcDateKey(next) }))
                }}
                disabled={popupWeekStart.getTime() === minWeekStart.getTime()}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2d3a] bg-[#242730] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium text-foreground">{formatWeekLabel(popupWeekStart)}</p>
              <button
                type="button"
                onClick={() => {
                  const next = clampWeekStart(shiftUtcWeek(popupWeekStart, 1), minWeekStart, maxWeekStart)
                  setPopupWeekByKey((prev) => ({ ...prev, [popupKey]: toUtcDateKey(next) }))
                }}
                disabled={popupWeekStart.getTime() === maxWeekStart.getTime()}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2d3a] bg-[#242730] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {popupLoading && <p className="mb-4 text-sm text-muted-foreground">Loading week data...</p>}

            {popupData && (
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#2a2d3a] p-3">
                  <p className="text-xs text-muted-foreground">Weekly Applications</p>
                  <p className="text-xl font-bold">{popupData.dailyApplications.reduce((sum, point) => sum + point.count, 0)}</p>
                </div>
                <div className="rounded-lg border border-[#2a2d3a] p-3">
                  <p className="text-xs text-muted-foreground">Weekly Rounds</p>
                  <p className="text-xl font-bold">{popupData.roundsPerDay.reduce((sum, point) => sum + point.count, 0)}</p>
                </div>
                <div className="rounded-lg border border-[#2a2d3a] p-3">
                  <p className="text-xs text-muted-foreground">Target Coverage</p>
                  <p className="text-xl font-bold">
                    {(() => {
                      const target = popupData.targetProgress.reduce((sum, point) => sum + point.target, 0)
                      const achieved = popupData.targetProgress.reduce((sum, point) => sum + point.achieved, 0)
                      return target > 0 ? `${Math.round((achieved / target) * 100)}%` : "0%"
                    })()}
                  </p>
                </div>
              </div>
            )}

            <div
              className={`${
                popupKey === "candidates"
                  ? "h-80"
                  : popupKey === "candidate-leaderboard"
                    ? "h-136"
                    : popupKey === "leaderboard"
                      ? "h-auto"
                      : "h-55"
              } overflow-hidden rounded-lg border border-[#2a2d3a] p-3`}
            >
              {popupData && popupKey === "employees" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popupData.recruiterApplicationCounts}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={firstName} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Bar dataKey="count" fill="#f5c842" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "candidates" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popupData.candidatesByStage.map((entry, index) => ({
                        ...entry,
                        fill: PIE_COLORS[index % PIE_COLORS.length],
                      }))}
                      dataKey="count"
                      nameKey="stage"
                      innerRadius={78}
                      outerRadius={140}
                      paddingAngle={4}
                      stroke="#0b1223"
                      strokeWidth={1}
                    />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Legend formatter={(value) => <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "placements" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={popupData.placementSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={toShortDate} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Area type="monotone" dataKey="count" stroke="#6fcf80" fill="#6fcf80" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "avg-apps" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popupData.recruiterApplicationCounts} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "#888", fontSize: 11 }} width={110} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Bar dataKey="count" fill="#f5c842" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "conversion" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Selected Week",
                        applications: popupData.dailyApplications.reduce((sum, point) => sum + point.count, 0),
                        placements: popupData.totalPlacements,
                      },
                    ]}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Legend />
                    <Bar dataKey="applications" fill="#9f7aea" />
                    <Bar dataKey="placements" fill="#6fcf80" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "avg-time" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={popupData.avgPlacementTimeSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={toShortDate} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }}
                      labelStyle={{ color: "#f0f0f0" }}
                      formatter={(value: number) => [`${value} days`, "Avg time"]}
                    />
                    <Line dataKey="days" stroke="#9f7aea" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "rounds-week" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popupData.roundsPerDay.map((point) => ({ ...point, weekday: toWeekday(point.date) }))}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="weekday" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Bar dataKey="count" fill="#5bc4f0" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "apps-week" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={popupData.dailyApplications}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={toShortDate} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Line dataKey="count" stroke="#9f7aea" strokeWidth={2} dot={{ r: 3, fill: "#9f7aea" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "target" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popupData.targetProgress.map((point) => ({
                      name: point.name,
                      percent: point.target > 0 ? Math.round((point.achieved / point.target) * 100) : 0,
                      target: 100,
                    }))}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={firstName} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} domain={[0, 130]} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }} labelStyle={{ color: "#f0f0f0" }} />
                    <Legend />
                    <ReferenceLine y={100} stroke="#888" strokeDasharray="4 4" />
                    <Bar dataKey="target" fill="#2a2d3a" stroke="#888" strokeWidth={1} />
                    <Bar dataKey="percent" fill="#f5c842" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {popupData && popupKey === "candidate-leaderboard" && (
                <div className="flex h-full flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#2a2d3a] p-3">
                      <p className="text-xs text-muted-foreground">Total submissions</p>
                      <p className="text-xl font-bold">{candidateLeaderboardTotal}</p>
                    </div>
                    <div className="rounded-lg border border-[#2a2d3a] p-3">
                      <p className="text-xs text-muted-foreground">Ranked employees</p>
                      <p className="text-xl font-bold">{candidateLeaderboardData.length}</p>
                    </div>
                    <div className="rounded-lg border border-[#2a2d3a] p-3">
                      <p className="text-xs text-muted-foreground">Snapshot day</p>
                      <p className="text-xl font-bold">{toShortDate(popupData.snapshotDate)}</p>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                    <div className="min-h-72 rounded-lg border border-[#2a2d3a] p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="x" type="number" hide domain={[1, Math.max(candidateLeaderboardBubbleData.length, 1)]} />
                          <YAxis dataKey="y" type="number" hide domain={[0, Math.max(candidateLeaderboardPeak?.count ?? 1, 1)]} />
                          <ZAxis dataKey="size" range={[120, 1300]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", color: "#f0f0f0" }}
                            labelStyle={{ color: "#f0f0f0" }}
                            formatter={(value: number) => [value, "Submissions"]}
                          />
                          <Scatter data={candidateLeaderboardBubbleData}>
                            {candidateLeaderboardBubbleData.map((point) => (
                              <Cell key={point.name} fill={point.fill} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-1">
                      {candidateLeaderboardBubbleData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded-md border border-[#1f2937] bg-[#0f172a] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-slate-950" style={{ backgroundColor: item.fill }}>
                              {item.rank}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-100">{item.name}</p>
                              <p className="text-xs text-slate-400">Rank #{item.rank}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-cyan-300">{item.count} submissions</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {popupData && popupKey === "leaderboard" && (
                <div className="space-y-2">
                  {[...popupData.recruiterApplicationCounts].sort((a, b) => b.count - a.count).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between rounded-md border border-[#1f2937] bg-[#0f172a] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Trophy className={`h-5 w-5 ${getTrophyColor(index)}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-400">Rank #{index + 1}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-cyan-300">{item.count} applications</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardWeekContext.Provider>
  )
}
