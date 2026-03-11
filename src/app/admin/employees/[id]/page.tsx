"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Mail, Phone, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";

import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { EditEmployeeModal } from "@/components/EditEmployeeModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fakeEmployees } from "@/lib/fakeEmployees";

function getStatusVariant(status: string) {
  if (status === "Placed") {
    return "success" as const;
  }

  if (status === "Rejected") {
    return "destructive" as const;
  }

  if (status === "Offer" || status === "Interviewing") {
    return "info" as const;
  }

  return "warning" as const;
}

export default function AdminEmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const employee = useMemo(
    () => fakeEmployees.find((item) => item.id === params.id),
    [params.id]
  );

  if (!employee) {
    return (
      <Card className="border-slate-700 bg-[#1f2937] text-slate-100">
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-lg font-semibold">Employee not found</p>
          <Button asChild variant="outline" className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700">
            <Link href="/admin/employees">Back to Employees</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const initials = employee.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-2xl border border-slate-700 bg-[#1f2937] p-6 shadow-md">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 border-2 border-slate-600">
            <AvatarImage src={employee.imageUrl} alt={employee.name} />
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={employee.role === "Admin" ? "info" : "secondary"}>{employee.role}</Badge>
              <span className="text-sm text-slate-400">Employee Profile</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
        <Card className="border-slate-700 bg-[#1f2937] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <User className="h-5 w-5 text-blue-400" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-400" /> {employee.email}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-400" /> {employee.phone}</p>
            <p className="sm:col-span-2 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-400" /> Last Activity: {employee.lastActivityDate}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-[#1f2937] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Users className="h-5 w-5 text-blue-400" /> Performance Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between"><span>Total Assigned Candidates</span><span>{employee.performance.totalAssignedCandidates}</span></div>
            <div className="flex items-center justify-between"><span>Total Applications Submitted</span><span>{employee.performance.totalApplicationsSubmitted}</span></div>
            <div className="flex items-center justify-between"><span>Total Interviews Scheduled</span><span>{employee.performance.totalInterviewsScheduled}</span></div>
            <div className="flex items-center justify-between"><span>Total Offers Extended</span><span>{employee.performance.totalOffersExtended}</span></div>
            <div className="flex items-center justify-between text-emerald-400"><span>Total Placements</span><span>{employee.performance.totalPlacements}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-700 bg-[#1f2937] shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-100">Assigned Candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {employee.assignedCandidates.length === 0 ? (
            <p className="text-sm text-slate-400">No assigned candidates</p>
          ) : (
            employee.assignedCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-slate-100">{candidate.name}</p>
                  <p className="text-sm text-slate-400">{candidate.email}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <Badge variant={getStatusVariant(candidate.currentProfileStatus)}>{candidate.currentProfileStatus}</Badge>
                    <span>Applications: {candidate.totalApplications}</span>
                    <span>Next Round: {candidate.nextRoundDate ?? "N/A"}</span>
                  </div>
                </div>

                <Button asChild variant="outline" className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700">
                  <Link href={`/admin/candidates/${candidate.id}`}>View Candidate</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-[#1f2937] shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-100">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPasswordOpen(true)}>
            Change Password
          </Button>
          <Button variant="outline" className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700" onClick={() => setEditOpen(true)}>
            Edit Employee
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordModal
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        employeeName={employee.name}
      />

      <EditEmployeeModal
        open={editOpen}
        onOpenChange={setEditOpen}
        employee={employee}
        onSave={() => {
          toast.success("Employee updated");
          setEditOpen(false);
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure? This will reassign candidates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.success("Employee deleted");
                setDeleteOpen(false);
                router.push("/admin/employees");
              }}
            >
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
