"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
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
  Upload,
  X,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
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

/** Add New Candidate form */
export function AddCandidateForm({ recruiters }: { recruiters: RecruiterOption[] }) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUvPassword, setShowUvPassword] = useState(false);

  // ── Resume upload state ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

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
    },
  });

  // ── Resume upload handlers ──
  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
      "application/msword",
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus("error");
      setUploadError("Only PDF or DOCX files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus("error");
      setUploadError("File size must be less than 5MB");
      return;
    }

    setResumeFile(file);
    setUploadStatus("uploading");
    setUploadError("");

    try {
      const candidateName = watch("name") || "Candidate";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidateName", candidateName);

      const response = await fetch("/api/uploads/resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResumeUrl(data.url);
      
      setUploadStatus("success");
      toast.success("Resume uploaded successfully!");
    } catch (error) {
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      setResumeFile(null);
      setResumeUrl("");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeUrl("");
    setUploadStatus("idle");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Skill handlers ──
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
    setShowSuggestions(false);
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const filtered = skillSuggestions.filter(
    (s) =>
      s.toLowerCase().includes(skillInput.toLowerCase()) &&
      !skills.includes(s)
  );

  // ── Form submit ──
  const onSubmit = async (data: CandidateFormValues) => {
    if (uploadStatus === "uploading") {
      toast.warning("Please wait for resume upload to complete");
      return;
    }

    try {
      const selectedRecruiter = recruiters.find(
        (recruiter) => recruiter.name === data.assignedRecruiter
      );

      if (!selectedRecruiter) {
        toast.error("Please select a recruiter");
        return;
      }

      await createCandidateAction({
        fullName: data.name,
        email: data.email,
        phone: data.phone || "NA",
        personalLinkedIn: data.linkedIn.startsWith("http")
          ? data.linkedIn
          : `https://${data.linkedIn}`,
        profilePhotoUrl: "",
        resumeUrl: resumeUrl || "",
        skills,
        experienceYears: Number(data.yearsOfExperience || 0),
        location: data.location || "Unknown",
        noticePeriod: data.noticePeriod || "Immediate",
        expectedCTC: data.expectedCtc || "TBD",
        status: "ACTIVE",
        recruiterId: selectedRecruiter.id,
        uvPhone: data.uvPhone || null,
        uvPassword: data.uvPassword || null,
      });

      toast.success("Candidate created successfully!", {
        description: `${data.name} has been added to the pipeline.`,
      });
      router.push("/dashboard/candidates");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create candidate"
      );
    }
  };

  const noticePeriod = watch("noticePeriod");

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
            <div className="flex flex-col items-center gap-1">
              <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Camera className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Upload Photo <span className="text-orange-500">(optional)</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="John Doe" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

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

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone Number{" "}
                <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
              />
            </div>

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
                <span className="absolute left-2.5 top-2 text-muted-foreground text-sm">
                  🔗
                </span>
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

          {/* ── Resume Upload ── */}
          <div className="space-y-1.5">
            <Label>
              Resume Upload{" "}
              <span className="text-orange-500 text-xs">(optional)</span>
            </Label>

            {/* Hidden file input — THIS is what opens the file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              onClick={(e) => e.stopPropagation()}
              style={{ display: "none" }}
            />

            {/* IDLE STATE */}
            {uploadStatus === "idle" && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  flex items-center justify-center w-full h-32
                  border-2 border-dashed rounded-lg cursor-pointer
                  transition-all duration-200 select-none
                  ${isDragOver
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-muted-foreground/30 bg-muted/30 hover:border-yellow-400 hover:bg-yellow-400/5"
                  }
                `}
              >
                <div className="text-center pointer-events-none">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {isDragOver ? "Drop file here" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF or DOCX up to 5MB
                  </p>
                </div>
              </div>
            )}

            {/* UPLOADING STATE */}
            {uploadStatus === "uploading" && (
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-yellow-400 rounded-lg bg-yellow-400/5">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium text-yellow-400">
                    Uploading...
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {resumeFile?.name}
                  </p>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {uploadStatus === "success" && (
              <div className="w-full border-2 border-dashed border-green-500/50 rounded-lg bg-green-500/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-500">
                        Resume uploaded
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {resumeFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resumeFile
                          ? `${(resumeFile.size / 1024).toFixed(1)} KB`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-3 py-1.5 rounded-md border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:border-yellow-400 hover:text-yellow-400 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveResume();
                      }}
                      className="text-xs px-3 py-1.5 rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR STATE */}
            {uploadStatus === "error" && (
              <div className="w-full border-2 border-dashed border-red-500/50 rounded-lg bg-red-500/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-500">
                        Upload failed
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {uploadError}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUploadStatus("idle");
                      setUploadError("");
                      fileInputRef.current?.click();
                    }}
                    className="text-xs px-3 py-1.5 rounded-md border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 transition-colors flex-shrink-0"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Skills Tags */}
          <div className="space-y-1.5">
            <Label>
              Skills Tags{" "}
              <span className="text-orange-500 text-xs">(optional)</span>
            </Label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md min-h-[42px] bg-background">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-primary/10 text-primary border-primary/20 gap-1"
                >
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
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  placeholder="e.g. Java, Python, Salesforce, React, Node.js, AWS, DevOps..."
                  className="w-full border-none outline-none text-sm bg-transparent placeholder:text-muted-foreground"
                />
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

          {/* Experience + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="yearsOfExperience">
                Years of Experience{" "}
                <span className="text-orange-500 text-xs">(optional)</span>
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
                Location{" "}
                <span className="text-orange-500 text-xs">(optional)</span>
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
                Notice Period{" "}
                <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Select
                value={noticePeriod}
                onValueChange={(val) => setValue("noticePeriod", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                Expected CTC (Annual){" "}
                <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <div className="flex gap-2">
                <Select defaultValue="INR">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
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

      {/* ── Recruitment Details ── */}
      <Card>
        <CardHeader>
          <CardTitle>Recruitment Details</CardTitle>
          <CardDescription>Internal assignment and notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Assigned Recruiter{" "}
              <span className="text-orange-500 text-xs">(optional)</span>
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

          <div className="space-y-1.5">
            <Label htmlFor="quickNotes">
              Quick Notes{" "}
              <span className="text-orange-500 text-xs">(optional)</span>
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

      {/* ── Unified Voice Credentials ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📞</span> Unified Voice Credentials
          </CardTitle>
          <CardDescription>
            Phone number and password used for Unified Voice app interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="uvPhone">
                UV Phone Number{" "}
                <span className="text-orange-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="uvPhone"
                placeholder="+1 (555) 000-0000"
                {...register("uvPhone")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uvPassword">
                UV Password{" "}
                <span className="text-orange-500 text-xs">(optional)</span>
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
                  {showUvPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
          className="bg-yellow-500 hover:bg-yellow-600 px-8 text-black font-semibold"
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