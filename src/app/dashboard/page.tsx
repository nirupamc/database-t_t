import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CandidateCards } from "@/components/dashboard/candidate-cards";
import { dashboardStats } from "@/lib/data";

/** Dashboard – Recruiter Overview */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recruiter Overview</h1>
        <p className="text-muted-foreground">
          Manage your active pipeline and upcoming interviews
        </p>
      </div>

      {/* Stats row */}
      <StatsCards />

      {/* Recent Candidates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Candidates</h2>
          <Button variant="link" className="text-primary" asChild>
            <Link href="/dashboard/candidates">View All Candidates</Link>
          </Button>
        </div>
        <CandidateCards />
      </div>

      {/* Current Goal progress */}
      <div className="fixed bottom-6 left-6 lg:left-[calc(16rem+1.5rem)] w-44 rounded-xl border bg-card p-4 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Current Goal
        </p>
        <Progress value={dashboardStats.goalProgress} className="h-2 mb-1" />
        <p className="text-xs text-muted-foreground">
          {dashboardStats.goalProgress}% of monthly target met
        </p>
      </div>

      {/* Floating + button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-emerald-600 hover:bg-emerald-700"
        asChild
      >
        <Link href="/add-candidate">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}
