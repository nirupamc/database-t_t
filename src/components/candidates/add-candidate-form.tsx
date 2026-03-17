"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Camera,
  Loader2,
  Upload,
  X,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import { createCandidateAction } from "@/actions/candidates";

// ── Zod schema ──
const candidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  linkedIn: z
    .string()
    .min(1, "LinkedIn URL is required")
    .refine(
      (val) => val.includes("linkedin.com") || val.startsWith("http"),
      "Please enter a valid LinkedIn URL"
    ),
  yearsOfExperience: z.string().optional(),
  location: z.string().optional(),
  noticePeriod: z.string().optional(),
  expectedCtc: z.string().optional(),
  assignedRecruiter: z.string().optional(),
  quickNotes: z.string().optional(),
  uvPhone: z.string().optional(),
  uvPassword: z.string().optional(),
  resumeUrl: z.string().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface RecruiterOption {
  id: string;
  name: string;
  email: string;
}

// ── Skill suggestions ──
const skillSuggestions = [
  "Java", "Python", "React", "Node.js", "Salesforce", "AWS", "Docker",
  "Kubernetes", "Spring Boot", "TypeScript", "Apex", "Tailwind CSS",
  "DevOps", "REST APIs", "GraphQL", "MongoDB", "PostgreSQL", "DynamoDB",
];

const RESUME_ACCEPT_ATTR = ".pdf,.doc,.docx";
const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

/** Add New Candidate form */
export function AddCandidateForm({ recruiters, isAdmin = false }: { recruiters: RecruiterOption[]; isAdmin?: boolean }) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUvPassword, setShowUvPassword] = useState(false);
  const [resumeUpload, setResumeUpload] = useState<{ name: string; url: string; size: number } | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      noticePeriod: "Immediate",
      resumeUrl: "",
    },
  });

  // Add a skill tag
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
    setShowSuggestions(false);
  };

  // Remove skill tag
  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Handle skill input keydown
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  // Filtered suggestions
  const filtered = skillSuggestions.filter(
    (s) =>
      s.toLowerCase().includes(skillInput.toLowerCase()) &&
      !skills.includes(s)
  );

  const noticePeriod = watch("noticePeriod");
  const resumeUrlValue = watch("resumeUrl");

  const resetResumeInput = () => {
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  };

  const uploadResume = async (file: File) => {
    if (isUploadingResume) return;

    if (!RESUME_MIME_TYPES.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      resetResumeInput();
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      toast.error("Resume must be 5MB or smaller");
      resetResumeInput();
      return;
    }

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidateName", watch("name") || "Candidate");
      const response = await fetch("/api/uploads/resume", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Unable to upload resume");
      }
      setResumeUpload({ name: file.name, url: payload.url, size: file.size });
      setValue("resumeUrl", payload.url, { shouldValidate: false });
      toast.success("Resume uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
      resetResumeInput();
    }
  };

  const handleResumeInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadResume(file);
    }
  };

  const handleResumeDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isUploadingResume) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await uploadResume(file);
    }
  };

  const handleResumeDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleRemoveResume = () => {
    setResumeUpload(null);
    setValue("resumeUrl", "", { shouldValidate: false });
    toast.info("Resume removed");
    resetResumeInput();
  };

  const handleResumeZoneClick = () => {
    if (!isUploadingResume) {
      resumeInputRef.current?.click();
    }
  };

  // Submit
  const onSubmit = async (data: CandidateFormValues) => {
    try {
      // For non-admins, auto-assign themselves (only recruiter in the list)
      const selectedRecruiter = isAdmin
        ? recruiters.find((recruiter) => recruiter.name === data.assignedRecruiter)
        : recruiters[0];

      if (!selectedRecruiter) {
        toast.error("Please select a recruiter");
        return;
      }

      const payload = {
        fullName: data.name,
        email: data.email,
        phone: data.phone || "NA",
        personalLinkedIn: data.linkedIn.startsWith("http") ? data.linkedIn : `https://${data.linkedIn}`,
        profilePhotoUrl: "",
        resumeUrl: "",
        skills,
        experienceYears: Number(data.yearsOfExperience || 0),
        location: data.location || "Unknown",
        noticePeriod: data.noticePeriod || "Immediate",
        expectedCTC: data.expectedCtc || "TBD",
        status: "ACTIVE",
        recruiterId: selectedRecruiter.id,
        uvPhone: data.uvPhone || null,
        uvPassword: data.uvPassword || null,
      };

      payload.resumeUrl = data.resumeUrl?.trim() ?? "";

      await createCandidateAction(payload);

      toast.success("Candidate created successfully!", {
        description: `${data.name} has been added to the pipeline.`,
      });
      router.push("/dashboard/candidates");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create candidate");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Candidate</h1>
        <p className="text-muted-foreground">
          Register a new talent profile to the recruitment pipeline.
        </p>
      </div>

      {/* Step indicator */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3 px-5">
          <p className="text-sm font-semibold text-primary">Profile Setup</p>
        </CardContent>
      </Card>

      {/* ── Personal Information ── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Contact details and identity</CardDescription>
            </div>
            {/* Upload Photo placeholder */}
            <div className="flex flex-col items-center gap-1">
              <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Camera className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">Upload Photo <span className="text-orange-500">(optional)</span></span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone Number <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <Label htmlFor="linkedIn">
                LinkedIn URL <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="linkedIn"
                  placeholder="linkedin.com/in/johndoe"
                  className="pl-8"
                  {...register("linkedIn")}
                />
                <span className="absolute left-2.5 top-2 text-muted-foreground text-sm">🔗</span>
              </div>
              {errors.linkedIn && (
                <p className="text-xs text-destructive">{errors.linkedIn.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Professional Snapshot ── */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Snapshot</CardTitle>
          <CardDescription>Resume, experience and expectations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resume Upload */}
          <div className="space-y-1.5">
            <Label>
              Resume Upload <span className="text-orange-500 text-xs">(optional)</span>
            </Label>
            <input type="hidden" {...register("resumeUrl")} />
            <input
              ref={resumeInputRef}
              type="file"
              accept={RESUME_ACCEPT_ATTR}
              className="hidden"
              onChange={handleResumeInputChange}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={handleResumeZoneClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleResumeZoneClick();
                }
              }}
              onDrop={handleResumeDrop}
              onDragOver={handleResumeDragOver}
              className={`flex w-full h-32 items-center justify-center rounded-lg border-2 border-dashed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                resumeUrlValue ? "border-primary/40 bg-primary/5" : "border-muted-foreground/30 bg-muted/30 hover:border-primary/50"
              }`}
            >
              {isUploadingResume ? (
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  Uploading resume...
                </div>
              ) : resumeUrlValue ? (
                <div className="flex w-full items-center justify-between gap-4 px-4 text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{resumeUpload?.name ?? resumeUrlValue.split("/").pop()}</p>
                    <p className="text-xs text-muted-foreground">
                      {resumeUpload?.size ? formatFileSize(resumeUpload.size) : "Resume uploaded"}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 break-all">
                      {resumeUrlValue}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        if (typeof window !== "undefined") {
                          window.open(resumeUrlValue, "_blank", "noopener,noreferrer");
                        }
                      }}
                    >
                      View
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        handleRemoveResume();
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center px-4">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Drag and drop resume here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">PDF or DOCX up to 5MB</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumeUrlValue ? "Click the card to replace the uploaded resume or remove it to start over." : "We accept PDF, DOC, or DOCX files up to 5MB."}
            </p>
          </div>

          {/* Skills Tags */}
          <div className="space-y-1.5">
            <Label>
              Skills Tags <span className="text-orange-500 text-xs">(optional)</span>
            </Label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md min-h-[42px] bg-background">
              {skills.map((skill) => (
                <Badge key={skill} className="bg-primary/10 text-primary border-primary/20 gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleSkillKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g. Java, Python, Salesforce, React, Node.js, AWS, DevOps..."
                  className="w-full border-none outline-none text-sm bg-transparent placeholder:text-muted-foreground"
                />
                {/* Suggestions dropdown */}
                {showSuggestions && skillInput && filtered.length > 0 && (
                  <div className="absolute top-8 left-0 z-50 w-64 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
                    {filtered.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Experience + Location row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="yearsOfExperience">
                Years of Experience <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="yearsOfExperience"
                type="number"
                placeholder="5"
                {...register("yearsOfExperience")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">
                Location <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="e.g. New York, USA"
                  className="pl-8"
                  {...register("location")}
                />
              </div>
            </div>
          </div>

          {/* Notice Period + Expected CTC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Notice Period <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Select
                value={noticePeriod}
                onValueChange={(val) => setValue("noticePeriod", val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediate">Immediate</SelectItem>
                  <SelectItem value="15 Days">15 Days</SelectItem>
                  <SelectItem value="30 Days">30 Days</SelectItem>
                  <SelectItem value="60 Days">60 Days</SelectItem>
                  <SelectItem value="90 Days">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expectedCtc">
                Expected CTC (Annual) <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <div className="flex gap-2">
                <Select defaultValue="INR">
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹</SelectItem>
                    <SelectItem value="USD">$</SelectItem>
                    <SelectItem value="EUR">€</SelectItem>
                    <SelectItem value="GBP">£</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="expectedCtc"
                  placeholder="12,00,000"
                  className="flex-1"
                  {...register("expectedCtc")}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Recruitment Details (admin only) ── */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Recruitment Details</CardTitle>
            <CardDescription>Internal assignment and notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Assigned Recruiter */}
            <div className="space-y-1.5">
              <Label>
                Assigned Recruiter <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Select
                value={watch("assignedRecruiter")}
                onValueChange={(val) => setValue("assignedRecruiter", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a recruiter" />
                </SelectTrigger>
                <SelectContent>
                  {recruiters.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {r.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        {r.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="quickNotes">
                Quick Notes <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="quickNotes"
                placeholder="Add any initial feedback or specific requirements..."
                className="min-h-[100px]"
                {...register("quickNotes")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Unified Voice Credentials ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📞</span> Unified Voice Credentials
          </CardTitle>
          <CardDescription>
            Phone number and password used for Unified Voice app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="uvPhone">
                UV Phone Number <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="uvPhone"
                placeholder="+1 (555) 000-0000"
                {...register("uvPhone")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uvPassword">
                UV Password <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="uvPassword"
                  type={showUvPassword ? "text" : "password"}
                  placeholder="Enter UV password"
                  className="pr-10"
                  {...register("uvPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowUvPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showUvPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex items-center justify-center gap-4 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Candidate"}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Next: Add job applications to this profile
      </p>
    </form>
  );
}
