"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronRight,
  Plus,
  Briefcase,
} from "lucide-react";

import {
  RoundFormBlock,
  createBlankRound,
  type RoundFormData,
} from "@/components/applications/round-form-block";
import type { Candidate } from "@/types";
import { createApplicationAction } from "@/actions/applications";

// ── Zod schema ──
const applicationSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  company: z.string().min(1, "Company / client is required"),
  jobPostingUrl: z
    .string()
    .min(1, "Job posting URL is required")
    .url("Please enter a valid URL"),
  applicationDate: z.string().min(1, "Application date is required"),
  status: z.string().min(1, "Status is required"),
  quickNotes: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

// ── Status options ──
const statusOptions = [
  "Applied",
  "Interview Scheduled",
  "Feedback Received",
  "Offer Extended",
  "Placed",
  "Rejected",
  "On Hold",
] as const;

interface OptimizedResumeOption {
  id: string
  jobTitle: string
  company: string | null
  compatibilityScore: number
  atsResumeUrl: string | null
  formattedResumeUrl: string | null
  optimizedResumeUrl: string | null
  createdAt: Date
}

interface AddApplicationFormProps {
  candidate: Candidate;
  originalResumeUrl: string | null;
  optimizedResumes: OptimizedResumeOption[];
}

export function AddApplicationForm({ candidate, originalResumeUrl, optimizedResumes }: AddApplicationFormProps) {
  const router = useRouter();

  // ── Interview rounds state ──
  const [rounds, setRounds] = useState<RoundFormData[]>([]);

  // ── Status tracking for conditional accordion ──
  const [currentStatus, setCurrentStatus] = useState("Applied");

  // ── Resume selection state ──
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string>(
    originalResumeUrl || ''
  )
  const [selectedResumeLabel, setSelectedResumeLabel] = useState<string>(
    originalResumeUrl ? 'Original Resume' : 'none'
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      applicationDate: new Date().toISOString().split("T")[0],
      status: "Applied",
    },
  });

  // Watch status to conditionally show interview rounds
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedStatus = watch("status");

  // ── Round helpers ──
  const addRound = () => {
    setRounds((prev) => [...prev, createBlankRound(prev.length + 1)]);
  };

  const updateRound = (index: number, updated: RoundFormData) => {
    setRounds((prev) => prev.map((r, i) => (i === index ? updated : r)));
  };

  const deleteRound = (index: number) => {
    setRounds((prev) => prev.filter((_, i) => i !== index));
  };

  // When status changes to "Interview Scheduled" and no rounds exist, auto-add one
  const handleStatusChange = (value: string) => {
    setValue("status", value);
    setCurrentStatus(value);
    if (value === "Interview Scheduled" && rounds.length === 0) {
      setRounds([createBlankRound(1)]);
    }
  };

  // ── Submit ──
  const onSubmit = async (data: ApplicationFormValues) => {
    try {
      const resumePayload = {
        resumeUsedUrl: selectedResumeLabel === 'none'
          ? null
          : selectedResumeUrl || null,
        resumeUsedLabel: selectedResumeLabel === 'none'
          ? null
          : selectedResumeLabel || null,
      };

      console.log('[AddApplicationForm] Submitting with resume:', resumePayload);

      await createApplicationAction({
        candidateId: candidate.id,
        jobTitle: data.jobTitle,
        company: data.company,
        jobUrl: data.jobPostingUrl,
        source: "Manual",
        techTags: [],
        appliedDate: new Date(data.applicationDate).toISOString(),
        status:
          data.status === "Interview Scheduled"
            ? "INTERVIEW_SCHEDULED"
            : data.status === "Feedback Received"
              ? "FEEDBACK_RECEIVED"
              : data.status === "Offer Extended"
                ? "OFFER_EXTENDED"
                : data.status === "Placed"
                  ? "PLACED"
                  : data.status === "Rejected"
                    ? "REJECTED"
                    : data.status === "On Hold"
                      ? "ON_HOLD"
                      : "APPLIED",
        ...resumePayload,
      });

      toast.success("Application added successfully!", {
        description: `${data.jobTitle} @ ${data.company} has been saved.`,
      });
      router.push(`/dashboard/candidates/${candidate.id}?tab=applications`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add application");
    }
  };

  const showInterviewRounds =
    currentStatus === "Interview Scheduled" || watchedStatus === "Interview Scheduled";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href="/dashboard/candidates"
          className="hover:text-primary transition-colors"
        >
          Candidates
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/dashboard/candidates/${candidate.id}`}
          className="hover:text-primary transition-colors"
        >
          {candidate.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Add Application</span>
      </nav>

      {/* ── Page heading ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Application</h1>
          <p className="text-muted-foreground text-sm">
            Submit <span className="font-medium text-foreground">{candidate.name}</span> to a new job posting
          </p>
        </div>
      </div>

      {/* ── Main form card ── */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>
            Fill in the job posting details and submission info
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Row 1: Job Title + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Backend Engineer"
                {...register("jobTitle")}
              />
              {errors.jobTitle && (
                <p className="text-xs text-destructive">{errors.jobTitle.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">
                Company / Client <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                placeholder="e.g. TechNova Solutions"
                {...register("company")}
              />
              {errors.company && (
                <p className="text-xs text-destructive">{errors.company.message}</p>
              )}
            </div>
          </div>

          {/* Job Posting URL */}
          <div className="space-y-1.5">
            <Label htmlFor="jobPostingUrl">
              Job Posting URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="jobPostingUrl"
              placeholder="Paste LinkedIn job link or portal URL here"
              {...register("jobPostingUrl")}
            />
            <p className="text-xs text-muted-foreground">
              Ensure the URL is public/accessible
            </p>
            {errors.jobPostingUrl && (
              <p className="text-xs text-destructive">{errors.jobPostingUrl.message}</p>
            )}
          </div>

          {/* Application Date */}
          <div className="space-y-1.5">
            <Label htmlFor="applicationDate">
              Application Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="applicationDate"
              type="date"
              {...register("applicationDate")}
            />
            {errors.applicationDate && (
              <p className="text-xs text-destructive">
                {errors.applicationDate.message}
              </p>
            )}
          </div>

          {/* Application Status */}
          <div className="space-y-1.5">
            <Label>
              Application Status <span className="text-destructive">*</span>
            </Label>
            <Select value={watchedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Resume Version Selector ── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium">
              Resume Used
              <span className="text-muted-foreground text-xs ml-2">
                (optional)
              </span>
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select which resume version was submitted for this application
            </p>
          </div>

          <div className="space-y-2">

            {/* None option */}
            <label className={`
              flex items-center gap-3 p-3 rounded-lg border
              cursor-pointer transition-colors
              ${selectedResumeLabel === 'none'
                ? 'border-yellow-400 bg-yellow-400/5'
                : 'border-border hover:border-yellow-400/50'
              }
            `}>
              <input
                type="radio"
                name="resumeVersion"
                checked={selectedResumeLabel === 'none'}
                onChange={() => {
                  setSelectedResumeUrl('')
                  setSelectedResumeLabel('none')
                }}
                className="accent-yellow-400"
              />
              <p className="text-sm text-muted-foreground">
                Not specified
              </p>
            </label>

            {/* Original Resume */}
            <label className={`
              flex items-center justify-between gap-3 p-3
              rounded-lg border cursor-pointer transition-colors
              ${selectedResumeLabel === 'Original Resume'
                ? 'border-yellow-400 bg-yellow-400/5'
                : 'border-border hover:border-yellow-400/50'
              }
            `}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="resumeVersion"
                  checked={selectedResumeLabel === 'Original Resume'}
                  onChange={() => {
                    setSelectedResumeUrl(originalResumeUrl || '')
                    setSelectedResumeLabel('Original Resume')
                  }}
                  disabled={!originalResumeUrl}
                  className="accent-yellow-400"
                />
                <div>
                  <p className={`text-sm font-medium
                    ${!originalResumeUrl ? 'text-muted-foreground' : ''}
                  `}>
                    📄 Original Resume
                  </p>
                  {!originalResumeUrl && (
                    <p className="text-xs text-muted-foreground">
                      No resume uploaded yet
                    </p>
                  )}
                </div>
              </div>
              {originalResumeUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    window.open(
                      `https://docs.google.com/viewer?url=${encodeURIComponent(originalResumeUrl)}`,
                      '_blank'
                    )
                  }}
                  className="text-xs text-yellow-400 hover:underline
                    flex-shrink-0"
                >
                  Preview
                </button>
              )}
            </label>

            {/* Optimized Resume Options */}
            {optimizedResumes.length > 0 ? (
              optimizedResumes.map(resume => {
                const primaryUrl = resume.atsResumeUrl ||
                  resume.optimizedResumeUrl || ''
                const label = `Optimized: ${resume.jobTitle}${
                  resume.company ? ` @ ${resume.company}` : ''
                } — ${resume.compatibilityScore}/10 — ${
                  new Date(resume.createdAt).toLocaleDateString(
                    'en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }
                  )
                }`

                return (
                  <label
                    key={resume.id}
                    className={`
                      flex items-start justify-between gap-3 p-3
                      rounded-lg border cursor-pointer transition-colors
                      ${selectedResumeLabel === label
                        ? 'border-yellow-400 bg-yellow-400/5'
                        : 'border-border hover:border-yellow-400/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="resumeVersion"
                        checked={selectedResumeLabel === label}
                        onChange={() => {
                          setSelectedResumeUrl(primaryUrl)
                          setSelectedResumeLabel(label)
                        }}
                        className="accent-yellow-400 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          🤖 {resume.jobTitle}
                          {resume.company && (
                            <span className="text-muted-foreground
                              font-normal">
                              {' '}@ {resume.company}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold
                            text-yellow-400">
                            {resume.compatibilityScore}/10
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(resume.createdAt)
                              .toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                          </span>
                        </div>
                        {/* Show which versions available */}
                        <div className="flex gap-1 mt-1">
                          {resume.atsResumeUrl && (
                            <span className="text-xs px-1.5 py-0.5
                              bg-yellow-400/10 text-yellow-400 rounded
                              border border-yellow-400/20">
                              ATS
                            </span>
                          )}
                          {resume.formattedResumeUrl && (
                            <span className="text-xs px-1.5 py-0.5
                              bg-green-500/10 text-green-500 rounded
                              border border-green-500/20">
                              Formatted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview buttons */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {resume.atsResumeUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(
                              `https://docs.google.com/viewer?url=${encodeURIComponent(resume.atsResumeUrl!)}`,
                              '_blank'
                            )
                          }}
                          className="text-xs text-yellow-400
                            hover:underline"
                        >
                          ATS ↗
                        </button>
                      )}
                      {resume.formattedResumeUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(
                              `https://docs.google.com/viewer?url=${encodeURIComponent(resume.formattedResumeUrl!)}`,
                              '_blank'
                            )
                          }}
                          className="text-xs text-green-500
                            hover:underline"
                        >
                          Formatted ↗
                        </button>
                      )}
                    </div>
                  </label>
                )
              })
            ) : (
              <div className="p-3 border border-dashed border-border
                rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  No optimized resumes yet for this candidate.
                </p>
                <p className="text-xs text-muted-foreground text-center
                  mt-0.5">
                  Use Resume Studio to generate optimized versions.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Conditional: Interview Rounds ── */}
      {showInterviewRounds && (
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible defaultValue="interview-rounds">
              <AccordionItem value="interview-rounds" className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">
                      🎯 Interview Rounds
                    </span>
                    <Badge variant="info" className="text-xs">
                      {rounds.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Start with a Confirmation Call, add more rounds as needed.
                  </p>

                  {rounds.map((round, index) => (
                    <RoundFormBlock
                      key={round.id}
                      round={round}
                      roundIndex={index}
                      onChange={(updated) => updateRound(index, updated)}
                      onDelete={() => deleteRound(index)}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/30"
                    onClick={addRound}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Round {rounds.length + 1}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Notes ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional context about this application..."
            className="min-h-[100px]"
            {...register("quickNotes")}
          />
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/candidates/${candidate.id}?tab=applications`)
          }
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-yellow-500 hover:bg-yellow-600 px-8 text-black font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Application"}
        </Button>
      </div>
    </form>
  );
}
