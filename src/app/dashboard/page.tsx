import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CandidateCards } from "@/components/dashboard/candidate-cards";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@/types";

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

function mapApplicationStatus(status: string): ApplicationStatus {
  switch (status) {
    case "APPLIED":
      return "Applied";
    case "INTERVIEW_SCHEDULED":
      return "Interview Scheduled";
    case "FEEDBACK_RECEIVED":
      return "In Interview";
    case "OFFER_EXTENDED":
      return "Offer Stage";
    case "PLACED":
      return "Offer Received";
    case "ON_HOLD":
      return "On Hold";
    case "REJECTED":
    default:
      return "Rejected";
  }
}

/** Dashboard – Recruiter Overview */
export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const candidateWhere = session.user.role.toUpperCase() === "ADMIN" ? {} : { recruiterId: session.user.id };

  const [candidates, applications, pendingOffers] = await Promise.all([
    prisma.candidate.findMany({
      where: candidateWhere,
      include: {
        applications: {
          include: { rounds: true },
          orderBy: { appliedDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.application.findMany({
      where: session.user.role.toUpperCase() === "ADMIN" ? {} : { candidate: { recruiterId: session.user.id } },
      include: { rounds: true },
    }),
    prisma.application.count({
      where: {
        status: "OFFER_EXTENDED",
        ...(session.user.role.toUpperCase() === "ADMIN" ? {} : { candidate: { recruiterId: session.user.id } }),
      },
    }),
  ]);

  const interviewsThisWeek = applications.reduce(
    (count, application) => count + application.rounds.filter((round) => ["PENDING", "RESCHEDULED"].includes(round.roundStatus)).length,
    0
  );

  const dashboardStats = {
    activeCandidates: candidates.length,
    activeCandidatesChange: "+12%",
    interviewsThisWeek,
    interviewsNote: interviewsThisWeek > 0 ? "Upcoming interview rounds scheduled" : "No interviews scheduled",
    offersPending: pendingOffers,
    offersNote: pendingOffers > 0 ? "Offers awaiting candidate response" : "No pending offers",
    goalProgress: Math.min(100, Math.round((applications.length / 25) * 100)),
  };

  const recentCandidates = candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.fullName,
    skills: candidate.skills,
    applications: candidate.applications.map((application) => ({
      id: application.id,
      status: mapApplicationStatus(application.status),
      rounds: application.rounds.map((round) => ({
        id: round.id,
        date: round.date.toISOString(),
        time: round.time,
      })),
    })),
  }));

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
      <StatsCards dashboardStats={dashboardStats} />

      {/* Recent Candidates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Candidates</h2>
          <Button variant="link" className="text-primary" asChild>
            <Link href="/dashboard/candidates">View All Candidates</Link>
          </Button>
        </div>
        <CandidateCards candidates={recentCandidates} />
      </div>

      {/* Current Goal progress */}
      <div className="fixed bottom-6 left-6 lg:left-70 w-44 rounded-xl border bg-card p-4 shadow-lg">
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-yellow-500 hover:bg-yellow-600 text-black"
        asChild
      >
        <Link href="/add-candidate">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}
