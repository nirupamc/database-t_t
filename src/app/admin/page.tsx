"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, UserCog, Users, UserRoundCheck } from "lucide-react";

import { EmployeeTable } from "@/components/EmployeeTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EmployeeRecord } from "@/lib/fakeData";
import { candidatesSeed, employeesSeed, getCandidateMetrics } from "@/lib/fakeData";

export default function AdminDashboardPage() {
  const [employees, setEmployees] = useState(employeesSeed);

  const stats = useMemo(
    () => ({
      totalEmployees: employees.length,
      totalCandidates: candidatesSeed.length,
      placements: candidatesSeed.reduce(
        (count, candidate) => count + getCandidateMetrics(candidate).placements,
        0
      ),
    }),
    [employees.length]
  );

  const handleAddEmployee = (employee: EmployeeRecord) => {
    setEmployees((prev) => [employee, ...prev]);
  };

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
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
              <UserRoundCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-2xl font-bold">{stats.totalCandidates}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Placements</p>
              <p className="text-2xl font-bold">{stats.placements}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Admin workspaces are now split by function</h2>
            <p className="text-sm text-muted-foreground">
              Use dedicated Employees and Candidates pages for full-detail workflows and admin actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
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

      <EmployeeTable employees={employees} onAddEmployee={handleAddEmployee} />
    </div>
  );
}
