"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarDays, Mail, Phone, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";

import { changeEmployeePasswordAction, deleteEmployeeAction, updateEmployeeAction } from "@/actions/employees";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { EditEmployeeModal } from "@/components/EditEmployeeModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminEmployeeView } from "@/lib/admin-mappers";

interface RecruiterOption {
  id: string;
  name: string;
}

function getStatusVariant(status: string) {
  if (status === "Placed") return "success" as const;
  if (status === "Rejected") return "destructive" as const;
  if (status === "Offer Extended" || status === "Interview Scheduled") return "info" as const;
  return "warning" as const;
}

interface AdminEmployeeDetailClientProps {
  employee: AdminEmployeeView;
  recruiterOptions: RecruiterOption[];
}

export function AdminEmployeeDetailClient({ employee, recruiterOptions }: AdminEmployeeDetailClientProps) {
  const router = useRouter();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reassignRecruiterId, setReassignRecruiterId] = useState(recruiterOptions[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const initials = employee.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const handlePasswordChange = async (password: string) => {
    startTransition(async () => {
      try {
        await changeEmployeePasswordAction({ id: employee.id, password });
        toast.success("Password changed");
        setPasswordOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to change password");
      }
    });
  };

  const handleSave = async (payload: { id: string; name: string; email: string; phone: string; profilePhotoUrl?: string }) => {
    startTransition(async () => {
      try {
        await updateEmployeeAction({
          ...payload,
          role: employee.role === "Admin" ? "ADMIN" : "RECRUITER",
        });
        toast.success("Employee updated");
        setEditOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update employee");
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteEmployeeAction(
          employee.id,
          employee.assignedCandidates.length > 0 ? reassignRecruiterId || undefined : undefined
        );
        toast.success("Employee deleted");
        router.push("/admin/employees");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete employee");
      }
    });
  };

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
            <CardTitle className="flex items-center gap-2 text-slate-100"><User className="h-5 w-5 text-blue-400" /> Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-400" /> {employee.email}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-400" /> {employee.phone}</p>
            <p className="sm:col-span-2 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-400" /> Last Activity: {employee.lastActivityDate}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-[#1f2937] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100"><Users className="h-5 w-5 text-blue-400" /> Performance Stats</CardTitle>
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
              <div key={candidate.id} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4 lg:flex-row lg:items-center lg:justify-between">
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
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPasswordOpen(true)}>Change Password</Button>
          <Button variant="outline" className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700" onClick={() => setEditOpen(true)}>Edit Employee</Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Delete Employee</Button>
        </CardContent>
      </Card>

      <ChangePasswordModal open={passwordOpen} onOpenChange={setPasswordOpen} employeeName={employee.name} onPasswordChanged={handlePasswordChange} submitting={isPending} />

      <EditEmployeeModal open={editOpen} onOpenChange={setEditOpen} employee={employee} onSave={handleSave} submitting={isPending} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>Are you sure? This will reassign candidates.</DialogDescription>
          </DialogHeader>
          {employee.assignedCandidates.length > 0 && recruiterOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Reassign candidates to</p>
              <Select value={reassignRecruiterId} onValueChange={setReassignRecruiterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recruiter" />
                </SelectTrigger>
                <SelectContent>
                  {recruiterOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending || (employee.assignedCandidates.length > 0 && !reassignRecruiterId)}>Delete Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}