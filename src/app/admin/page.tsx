import Link from "next/link";
import { ArrowRight, UserCog } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { AdminEmployeesPageClient } from "@/components/AdminEmployeesPageClient";
import { mapRecruiterToAdminView } from "@/lib/admin-mappers";
import { AdminDashboardChartsLayer } from "@/app/admin/admin-dashboard-charts-layer";

export default async function AdminDashboardPage() {
  const recruiters = await prisma.recruiter.findMany({
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
  })

  const employees = recruiters.map(mapRecruiterToAdminView)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor recruiters, hiring activity, and candidate flow across the platform</p>
      </div>

      <AdminDashboardChartsLayer />

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
  )
}
