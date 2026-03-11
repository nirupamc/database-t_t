"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AdminCandidateCard } from "@/components/AdminCandidateCard";
import { CandidateDetailModal } from "@/components/CandidateDetailModal";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { candidatesSeed, employeesSeed, type CandidateRecord } from "@/lib/fakeData";

function CandidateCardSkeleton() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:bg-card">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-52 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
              <div className="h-3 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="h-9 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>(candidatesSeed);
  const [search, setSearch] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const recruiterOptions = useMemo(
    () => employeesSeed.filter((employee) => employee.role === "Recruiter").map((employee) => employee.name),
    []
  );

  const filteredCandidates = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const haystack = [candidate.name, candidate.email, candidate.assignedRecruiter].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [candidates, search]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId]
  );

  const handleDelete = (candidateId: string) => {
    setCandidates((prev) => prev.filter((candidate) => candidate.id !== candidateId));
    setSelectedCandidateId((prev) => (prev === candidateId ? null : prev));
  };

  const handleReassign = (candidateId: string, recruiter: string) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, assignedRecruiter: recruiter } : candidate
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">All Candidates</h1>
          <p className="text-muted-foreground">
            View and manage every candidate profile across all recruiters
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 border-slate-200 bg-white pl-9 shadow-sm"
            placeholder="Search by name, email or recruiter"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <CandidateCardSkeleton key={index} />)
          : filteredCandidates.map((candidate) => (
              <AdminCandidateCard
                key={candidate.id}
                candidate={candidate}
                onViewDetails={setSelectedCandidateId}
              />
            ))}
      </div>

      {!loading && filteredCandidates.length === 0 && (
        <Card className="border-dashed border-slate-300 bg-white shadow-sm dark:bg-card">
          <CardContent className="py-16 text-center">
            <h2 className="text-lg font-semibold">No candidates found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another name, email, or recruiter keyword.
            </p>
          </CardContent>
        </Card>
      )}

      <CandidateDetailModal
        candidate={selectedCandidate}
        open={selectedCandidate !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedCandidateId(null);
          }
        }}
        recruiterOptions={recruiterOptions}
        onDelete={handleDelete}
        onReassign={handleReassign}
      />
    </div>
  );
}