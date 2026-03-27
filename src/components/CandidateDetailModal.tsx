"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAdminCandidateMetrics,
  type AdminCandidateApplicationStatus,
  type AdminCandidateView,
  type AdminRoundStatus,
} from "@/lib/admin-mappers";

interface CandidateDetailModalProps {
  candidate: AdminCandidateView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recruiterOptions: Array<{ id: string; name: string }>;
  onDelete: (candidateId: string) => Promise<void>;
  onReassign: (candidateId: string, recruiterId: string) => Promise<void>;
}

function getApplicationVariant(status: AdminCandidateApplicationStatus) {
  if (status === "Placed") {
    return "success" as const;
  }

  if (status === "Rejected") {
    return "destructive" as const;
  }

  if (status === "Offer Extended" || status === "Interview Scheduled") {
    return "info" as const;
  }

  return "warning" as const;
}

function getRoundVariant(status: AdminRoundStatus) {
  if (status === "Cleared") {
    return "success" as const;
  }

  if (status === "Failed") {
    return "destructive" as const;
  }

  if (status === "Rescheduled") {
    return "warning" as const;
  }

  return "info" as const;
}

export function CandidateDetailModal({
  candidate,
  open,
  onOpenChange,
  recruiterOptions,
  onDelete,
  onReassign,
}: CandidateDetailModalProps) {
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (candidate) {
      setSelectedRecruiter(candidate.recruiterId);
    }
  }, [candidate]);

  if (!candidate) {
    return null;
  }

  const metrics = getAdminCandidateMetrics(candidate);
  const initials = candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto border-slate-200 bg-white p-0 shadow-2xl dark:bg-card">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/40">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-foreground">
                {candidate.name}
              </DialogTitle>
              <DialogDescription>
                Complete admin view of profile data, application activity, recruiter ownership, and round feedback.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-6 px-6 py-6">
            <section className="grid gap-6 lg:grid-cols-[260px,1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-card">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 border-4 border-blue-100 shadow-sm">
                    <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                    <AvatarFallback className="bg-blue-100 text-2xl font-bold text-blue-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-foreground">
                    {candidate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{candidate.title}</p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge variant="info" className="bg-blue-50 text-blue-700">
                      {candidate.assignedRecruiter}
                    </Badge>
                    <Badge variant={getApplicationVariant(metrics.latestApplicationStatus)}>
                      {metrics.latestApplicationStatus}
                    </Badge>
                  </div>

                  <Button asChild className="mt-5 w-full bg-blue-600 hover:bg-blue-700">
                    <a href={candidate.resumeLink} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4" /> View Resume
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-card">
                  <div className="mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold">Personal Details</h4>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <a href={`mailto:${candidate.email}`} className="rounded-xl border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/50">
                      <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.email}</p>
                    </a>
                    <a href={`tel:${candidate.phone.replace(/\s+/g, "")}`} className="rounded-xl border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/50">
                      <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> Phone
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.phone}</p>
                    </a>
                    {candidate.linkedInUrl && (
                      <a href={candidate.linkedInUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/50">
                        <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                        </p>
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-foreground">{candidate.linkedInUrl}</p>
                      </a>
                    )}
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.location}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notice Period</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.noticePeriod}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Expected CTC</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.expectedCtc}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Experience</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.experienceYears} years</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Applications</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">{metrics.totalApplications}</p>
                    </div>
                  </div>
                </div>

                {(candidate.employmentType || candidate.workMode || candidate.candidateType) && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-card">
                    <div className="mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold">Employment Preferences</h4>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {candidate.employmentType && (
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Employment Type</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.employmentType.replace(/_/g, "-")}</p>
                        </div>
                      )}
                      {candidate.workMode && (
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Work Mode</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.workMode.replace(/_/g, "-")}</p>
                        </div>
                      )}
                      {candidate.candidateType && (
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Candidate Type</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-foreground">{candidate.candidateType === "C2C" ? "C2C" : candidate.candidateType.replace(/_/g, "-")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Applications</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.totalApplications}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Applications</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.activeApplications}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Interviews Scheduled</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.interviewsScheduled}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Offers Extended</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.offersExtended}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Placements</p>
                    <p className="mt-2 text-2xl font-semibold text-yellow-600">{metrics.placements}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-card">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <h4 className="text-lg font-semibold">Applications</h4>
              </div>

              <Accordion type="multiple" className="space-y-3">
                {candidate.applications.map((application) => (
                  <AccordionItem key={application.id} value={application.id} className="rounded-xl border border-slate-200 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full flex-col gap-2 pr-4 text-left sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-foreground">
                            {application.jobTitle} @ {application.company}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied {application.appliedDate} via {application.source}
                          </p>
                        </div>
                        <Badge variant={getApplicationVariant(application.status)}>{application.status}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <a href={application.jobPostingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
                          <Globe className="h-4 w-4" /> Job Posting URL
                        </a>
                        {application.techTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-slate-900 dark:text-foreground">Interview Rounds</h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.success(`Added a new round for ${application.jobTitle}`)}
                          >
                            + Add Round
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {application.rounds.map((round) => (
                            <div key={round.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:bg-slate-900/40">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-foreground">{round.roundType}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {round.dateTime} · {round.timezone} · {round.duration}
                                  </p>
                                </div>
                                <Badge variant={getRoundVariant(round.status)}>{round.status}</Badge>
                              </div>

                              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mode</p>
                                  <p>{round.mode}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">VC Receiver</p>
                                  <p>{round.vcReceiver}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Frontend</p>
                                  <p>{round.frontend ? "Yes" : "No"}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Lipsync</p>
                                  <p>{round.lipsync ? "Yes" : "No"}</p>
                                </div>
                                <div className="sm:col-span-2 xl:col-span-2">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Feedback</p>
                                  <p>{round.feedback}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr,320px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-card">
                <h4 className="text-lg font-semibold">Quick Notes</h4>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{candidate.quickNotes}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-card">
                <h4 className="text-lg font-semibold">Admin Actions</h4>
                <div className="mt-4 space-y-3">
                  <Button variant="outline" className="w-full" onClick={() => toast.success(`Edit mode opened for ${candidate.name}`)}>
                    Edit Candidate
                  </Button>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reassign Recruiter</p>
                    <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recruiter" />
                      </SelectTrigger>
                      <SelectContent>
                        {recruiterOptions.map((recruiter) => (
                          <SelectItem key={recruiter.id} value={recruiter.id}>
                            {recruiter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={submitting}
                      onClick={async () => {
                        try {
                          setSubmitting(true);
                          await onReassign(candidate.id, selectedRecruiter);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Save Assignment
                    </Button>
                  </div>

                  <Button variant="destructive" className="w-full" onClick={() => setConfirmDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" /> Delete Candidate
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete candidate?</DialogTitle>
            <DialogDescription>
              This removes {candidate.name} from the mock admin list. This action cannot be undone in the current session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={async () => {
                try {
                  setSubmitting(true);
                  await onDelete(candidate.id);
                  setConfirmDeleteOpen(false);
                  onOpenChange(false);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Delete Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}