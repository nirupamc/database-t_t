'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setRecruiterTargetAction } from "@/actions/targets"

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
}

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
]

const yearOptions = [2025, 2026, 2027]

export function AdminTargetsPage({ recruiters, currentMonth, currentYear }: AdminTargetsPageProps) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [editingTarget, setEditingTarget] = useState<RecruiterTargetRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [targetForm, setTargetForm] = useState({ applicationTarget: 0, placementTarget: 0 })

  const totalRecruitersWithTargets = recruiters.filter((recruiter) => recruiter.target).length
  const targetsMetApplications = recruiters.filter((recruiter) => recruiter.applicationsMet).length
  const targetsMetPlacements = recruiters.filter((recruiter) => recruiter.placementsMet).length
  const totalApplications = recruiters.reduce((sum, recruiter) => sum + recruiter.applicationsCount, 0)

  const currentMonthLabel = useMemo(() => months[selectedMonth - 1], [selectedMonth])

  const openTargetEditor = (recruiter: RecruiterTargetRow) => {
    setEditingTarget(recruiter)
    setTargetForm({
      applicationTarget: recruiter.target?.applicationTarget ?? 0,
      placementTarget: recruiter.target?.placementTarget ?? 0,
    })
  }

  const handleSaveTarget = async () => {
    if (!editingTarget) return

    setIsSaving(true)
    try {
      console.log("[AdminTargets] saving target for recruiter:", editingTarget.id)
      await setRecruiterTargetAction({
        recruiterId: editingTarget.id,
        month: selectedMonth,
        year: selectedYear,
        applicationTarget: targetForm.applicationTarget,
        placementTarget: targetForm.placementTarget,
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

  const navigateToPeriod = (month: number, year: number) => {
    const params = new URLSearchParams()
    params.set("month", String(month))
    params.set("year", String(year))
    router.push(`/admin/targets?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">Recruiter Targets</h1>
          <p className="text-muted-foreground">Set and monitor monthly application and placement goals for each recruiter.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(event) => {
              const nextMonth = Number(event.target.value)
              setSelectedMonth(nextMonth)
              navigateToPeriod(nextMonth, selectedYear)
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
              navigateToPeriod(selectedMonth, nextYear)
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Recruiters with Targets", value: totalRecruitersWithTargets, icon: "🎯" },
          { label: "Targets Met (Applications)", value: targetsMetApplications, icon: "✅" },
          { label: "Targets Met (Placements)", value: targetsMetPlacements, icon: "🏆" },
          { label: "Total Applications", value: totalApplications, icon: "📄" },
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
                {recruiter.target ? "Edit Target" : "Set Target"}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Applications</span>
                <span className="font-semibold">
                  {recruiter.applicationsCount}
                  {recruiter.target && <span className="font-normal text-muted-foreground">/{recruiter.target.applicationTarget}</span>}
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
                {!recruiter.target && <span className="text-yellow-400">No target set</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Placements</span>
                <span className="font-semibold">
                  {recruiter.placementsCount}
                  {recruiter.target && <span className="font-normal text-muted-foreground">/{recruiter.target.placementTarget}</span>}
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-background p-6">
            <h3 className="text-lg font-bold">Set Target for {editingTarget.name}</h3>
            <p className="text-sm text-muted-foreground">{currentMonthLabel} {selectedYear}</p>

            <div className="space-y-4">
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