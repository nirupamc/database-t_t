"use client";

"use no memo";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCandidateMetrics, type CandidateRecord } from "@/lib/fakeData";

interface CandidateTableProps {
  candidates: CandidateRecord[];
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  const [nameFilter, setNameFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const recruiters = useMemo(
    () => Array.from(new Set(candidates.map((candidate) => candidate.assignedRecruiter))),
    [candidates]
  );

  const filteredData = useMemo(
    () =>
      candidates.filter((candidate) => {
        const matchesName = candidate.name.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesRecruiter =
          recruiterFilter === "all" || candidate.assignedRecruiter === recruiterFilter;
        const metrics = getCandidateMetrics(candidate);
        const matchesStatus =
          statusFilter === "all" || metrics.latestApplicationStatus === statusFilter;
        return matchesName && matchesRecruiter && matchesStatus;
      }),
    [candidates, nameFilter, recruiterFilter, statusFilter]
  );

  const columns = useMemo<ColumnDef<CandidateRecord>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "assignedRecruiter", header: "Assigned Recruiter" },
      {
        id: "applications",
        header: "Applications",
        cell: ({ row }) => getCandidateMetrics(row.original).totalApplications,
      },
      {
        id: "latestStatus",
        header: "Latest Status",
        cell: ({ row }) => {
          const status = getCandidateMetrics(row.original).latestApplicationStatus;
          const variant =
            status === "Placed"
              ? "success"
              : status === "Offer" || status === "Interviewing"
                ? "info"
                : status === "Rejected"
                  ? "destructive"
                  : "warning";
          return <Badge variant={variant}>{status}</Badge>;
        },
      },
      {
        id: "details",
        header: "Details",
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            <p>{row.original.title}</p>
            <p>{row.original.location}</p>
            <p>{row.original.noticePeriod}</p>
            <p>{row.original.expectedCtc}</p>
          </div>
        ),
      },
      {
        id: "metrics",
        header: "Funnel",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">
              Active {getCandidateMetrics(row.original).activeApplications}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Interviews {getCandidateMetrics(row.original).interviewsScheduled}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Offers {getCandidateMetrics(row.original).offersExtended}
            </Badge>
          </div>
        ),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <Button asChild size="sm" variant="outline">
            <Link href={`/candidates/${row.original.id}`}>View Full Profile</Link>
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Candidates</h3>
            <p className="text-sm text-muted-foreground">All candidates across recruiters</p>
          </div>
          <Button
            onClick={() => toast.success("Exported to CSV")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="mr-2 h-4 w-4" /> Export All Data
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              className="pl-8"
              placeholder="Search by name"
            />
          </div>

          <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by recruiter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All recruiters</SelectItem>
              {recruiters.map((recruiter) => (
                <SelectItem key={recruiter} value={recruiter}>
                  {recruiter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Applied">Applied</SelectItem>
              <SelectItem value="Interviewing">Interviewing</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
              <SelectItem value="Placed">Placed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
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
    </Card>
  );
}
