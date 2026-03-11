"use client";

"use no memo";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, KeyRound, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddEmployeeModal } from "@/components/AddEmployeeModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import type { EmployeeRecord } from "@/lib/fakeData";

interface EmployeeTableProps {
  employees: EmployeeRecord[];
  onAddEmployee: (employee: EmployeeRecord) => void;
}

export function EmployeeTable({ employees, onAddEmployee }: EmployeeTableProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const columns = useMemo<ColumnDef<EmployeeRecord>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={row.original.role === "Admin" ? "default" : "secondary"}>
            {row.original.role}
          </Badge>
        ),
      },
      { accessorKey: "assignedCandidates", header: "Candidates" },
      { accessorKey: "totalApplications", header: "Applications" },
      { accessorKey: "totalPlacements", header: "Placements" },
      { accessorKey: "lastActivityDate", header: "Last Activity" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setSelectedEmployee(row.original)}>
            <Eye className="mr-1 h-4 w-4" /> View Details
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Employees</h3>
            <p className="text-sm text-muted-foreground">Manage recruiter and admin users</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add New Employee
          </Button>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <AddEmployeeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddEmployee={(employee) =>
          onAddEmployee({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            assignedCandidates: employee.performance.totalAssignedCandidates,
            totalApplications: employee.performance.totalApplicationsSubmitted,
            totalPlacements: employee.performance.totalPlacements,
            lastActivityDate: employee.lastActivityDate,
          })
        }
      />

      <Dialog open={Boolean(selectedEmployee)} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent>
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEmployee.name}</DialogTitle>
                <DialogDescription>{selectedEmployee.email}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <p className="text-muted-foreground">Role</p>
                <p>{selectedEmployee.role}</p>
                <p className="text-muted-foreground">Assigned Candidates</p>
                <p>{selectedEmployee.assignedCandidates}</p>
                <p className="text-muted-foreground">Applications Submitted</p>
                <p>{selectedEmployee.totalApplications}</p>
                <p className="text-muted-foreground">Placements</p>
                <p>{selectedEmployee.totalPlacements}</p>
                <p className="text-muted-foreground">Last Activity</p>
                <p>{selectedEmployee.lastActivityDate}</p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                  <KeyRound className="mr-2 h-4 w-4" /> Change Password
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        employeeName={selectedEmployee?.name ?? "Employee"}
      />
    </Card>
  );
}
