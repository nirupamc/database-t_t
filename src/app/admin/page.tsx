import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, UserCog, Users, UserRoundCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { AdminEmployeesPageClient } from "@/components/AdminEmployeesPageClient";
import { mapRecruiterToAdminView } from "@/lib/admin-mappers";

export default async function AdminDashboardPage() {
  const [recruiters, candidateCount] = await Promise.all([
    prisma.recruiter.findMany({
      include: {
        candidates: {
          include: {
            applications: {
              include: { rounds: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.candidate.count(),
  ]);

  const employees = recruiters.map(mapRecruiterToAdminView);

  const totalPlacements = employees.reduce(
    (sum, emp) => sum + emp.performance.totalPlacements,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor recruiters, hiring activity, and candidate flow across the platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
              <UserRoundCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-2xl font-bold">{candidateCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Placements</p>
              <p className="text-2xl font-bold">{totalPlacements}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-yellow-100 dark:border-yellow-900/30 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Admin workspaces are now split by function</h2>
            <p className="text-sm text-muted-foreground">
              Use dedicated Employees and Candidates pages for full-detail workflows and admin actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              <Link href="/admin/employees">
                <UserCog className="h-4 w-4" /> Employees <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/candidates">
                Candidates <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminEmployeesPageClient initialEmployees={employees} />
    </div>
  );
}
