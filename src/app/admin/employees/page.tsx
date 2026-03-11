"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, Search, UserPlus } from "lucide-react";

import { AddEmployeeModal } from "@/components/AddEmployeeModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fakeEmployees, type EmployeeRecord } from "@/lib/fakeEmployees";

"use no memo";

function EmployeeTableSkeleton() {
  return (
    <Card className="border-slate-700 bg-[#1f2937] shadow-md">
      <CardContent className="space-y-3 p-5">
        {Array.from({ length: 7 }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((__, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="h-8 animate-pulse rounded-md bg-slate-700/60"
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MobileEmployeeCard({ employee }: { employee: EmployeeRecord }) {
  const initials = employee.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="border-slate-700 bg-[#1f2937] shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={employee.imageUrl} alt={employee.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-100">{employee.name}</p>
            <p className="truncate text-xs text-slate-400">{employee.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <p>Phone: {employee.phone}</p>
          <p>Candidates: {employee.performance.totalAssignedCandidates}</p>
          <p>Applications: {employee.performance.totalApplicationsSubmitted}</p>
          <p>Placements: {employee.performance.totalPlacements}</p>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={employee.role === "Admin" ? "info" : "secondary"}>{employee.role}</Badge>
          <Button asChild size="sm" variant="outline" className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700">
            <Link href={`/admin/employees/${employee.id}`}>
              <Eye className="mr-1 h-3.5 w-3.5" /> View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>(fakeEmployees);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return employees;
    }

    return employees.filter((employee) =>
      `${employee.name} ${employee.email}`.toLowerCase().includes(term)
    );
  }, [employees, search]);

  const columns = useMemo<ColumnDef<EmployeeRecord>[]>(
    () => [
      {
        id: "avatar",
        header: "",
        cell: ({ row }) => {
          const employee = row.original;
          const initials = employee.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <Avatar className="h-9 w-9 border border-slate-600">
              <AvatarImage src={employee.imageUrl} alt={employee.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          );
        },
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={row.original.role === "Admin" ? "info" : "secondary"}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        id: "assigned",
        header: "Assigned Candidates",
        cell: ({ row }) => row.original.performance.totalAssignedCandidates,
      },
      {
        id: "applications",
        header: "Total Applications Submitted",
        cell: ({ row }) => row.original.performance.totalApplicationsSubmitted,
      },
      {
        id: "placements",
        header: "Placements",
        cell: ({ row }) => row.original.performance.totalPlacements,
      },
      { accessorKey: "lastActivityDate", header: "Last Activity Date" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button asChild size="sm" variant="outline" className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700">
            <Link href={`/admin/employees/${row.original.id}`}>
              <Eye className="mr-1 h-3.5 w-3.5" /> View Details
            </Link>
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredEmployees,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-slate-400">Manage recruiters and admin users</p>
        </div>

        <div className="flex w-full max-w-xl gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 border-slate-700 bg-[#1f2937] pl-9 text-slate-100 placeholder:text-slate-400"
              placeholder="Search by name or email"
            />
          </div>
          <Button className="h-11 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setAddOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New Employee
          </Button>
        </div>
      </div>

      {loading ? (
        <EmployeeTableSkeleton />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-slate-700 bg-[#1f2937] shadow-md md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-slate-700 hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-slate-300">
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
                  <TableRow key={row.id} className="border-slate-700 hover:bg-slate-800/70">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-slate-200">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 md:hidden">
            {filteredEmployees.map((employee) => (
              <MobileEmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <Card className="border-slate-700 bg-[#1f2937]">
              <CardContent className="py-12 text-center text-slate-300">
                No employees match this search.
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AddEmployeeModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAddEmployee={(employee) => setEmployees((prev) => [employee, ...prev])}
      />
    </div>
  );
}
