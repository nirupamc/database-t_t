"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState } from "react";
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
import {
  Loader2,
  Upload,
  X,
  MapPin,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { updateCandidateAction } from "@/actions/candidates";
import Link from "next/link";

// ── Zod schema ──
const editCandidateSchema = z.object({
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
  yearsOfExperience: z.string().min(1, "Please select years of experience"),
  location: z.string().optional(),
  noticePeriod: z.string().optional(),
  expectedCtc: z.string().optional(),
  assignedRecruiter: z.string().optional(),
  uvPhone: z.string().optional(),
  uvPassword: z.string().optional(),
});

type EditCandidateFormValues = z.infer<typeof editCandidateSchema>;

interface RecruiterOption {
  id: string;
  name: string;
  email: string;
}

interface CandidateData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  personalLinkedIn: string;
  skills: string[];
  experienceYears: number;
  location: string;
  noticePeriod: string;
  expectedCTC: string;
  recruiterId: string;
  uvPhone?: string | null;
  uvPassword?: string | null;
  resumeUrl?: string | null;
  recruiter: {
    name: string;
  };
}

// ── Skill suggestions ──
const skillSuggestions = [
  "Java", "Python", "React", "Node.js", "Salesforce", "AWS", "Docker",
  "Kubernetes", "Spring Boot", "TypeScript", "Apex", "Tailwind CSS",
  "DevOps", "REST APIs", "GraphQL", "MongoDB", "PostgreSQL", "DynamoDB",
];

interface EditCandidateFormProps {
  candidate: CandidateData;
  recruiters: RecruiterOption[];
  isAdmin: boolean;
}

export function EditCandidateForm({ candidate, recruiters, isAdmin }: EditCandidateFormProps) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(candidate.skills);
  const [skillInput, setSkillInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUvPassword, setShowUvPassword] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterOption | null>(
    recruiters.find((r) => r.id === candidate.recruiterId) || null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditCandidateFormValues>({
    resolver: zodResolver(editCandidateSchema),
    defaultValues: {
      name: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone || "",
      linkedIn: candidate.personalLinkedIn,
      yearsOfExperience: String(candidate.experienceYears),
      location: candidate.location || "",
      noticePeriod: candidate.noticePeriod || "Immediate",
      expectedCtc: candidate.expectedCTC || "",
      assignedRecruiter: candidate.recruiterId,
      uvPhone: candidate.uvPhone || "",
      uvPassword: candidate.uvPassword || "",
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

  // ── Submit handler ──
  const onSubmit = async (data: EditCandidateFormValues) => {
    try {
      const payload = {
        id: candidate.id,
        fullName: data.name,
        email: data.email,
        phone: data.phone || "NA",
        personalLinkedIn: data.linkedIn.startsWith("http") ? data.linkedIn : `https://${data.linkedIn}`,
        profilePhotoUrl: "",
        resumeUrl: candidate.resumeUrl || "",
        skills,
        experienceYears: Number(data.yearsOfExperience),
        location: data.location || "Unknown",
        noticePeriod: data.noticePeriod || "Immediate",
        expectedCTC: data.expectedCtc || "TBD",
        status: "ACTIVE",
        recruiterId: isAdmin && selectedRecruiter ? selectedRecruiter.id : candidate.recruiterId,
        uvPhone: data.uvPhone || null,
        uvPassword: data.uvPassword || null,
      };

      await updateCandidateAction(payload);

      toast.success("Candidate updated successfully!", {
        description: `${data.name}'s profile has been updated.`,
      });

      router.push(`/dashboard/candidates/${candidate.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error("Failed to update candidate", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/candidates/${candidate.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <CardTitle className="text-xl">Edit Candidate</CardTitle>
            <CardDescription>Update {candidate.fullName}&apos;s profile information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>

            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Phone + LinkedIn row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone <span className="text-orange-500 text-xs">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  {...register("phone")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkedIn">
                  LinkedIn URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="linkedIn"
                  placeholder="linkedin.com/in/johndoe"
                  {...register("linkedIn")}
                />
                {errors.linkedIn && (
                  <p className="text-xs text-red-500">{errors.linkedIn.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Skills
            </h3>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="relative">
                <Input
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleSkillKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Type a skill and press Enter"
                />
                {showSuggestions && filtered.length > 0 && skillInput && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-auto">
                    {filtered.slice(0, 6).map((s) => (
                      <button
                        type="button"
                        key={s}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        onClick={() => addSkill(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-2.5 py-1 gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Professional Details
            </h3>

            {/* Experience + Location row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="yearsOfExperience">
                  Years of Experience <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch("yearsOfExperience") || ""}
                  onValueChange={(value) => setValue("yearsOfExperience", value)}
                >
                  <SelectTrigger id="yearsOfExperience">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Fresher (0 years)</SelectItem>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="4">4 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="6">6 years</SelectItem>
                    <SelectItem value="7">7 years</SelectItem>
                    <SelectItem value="8">8 years</SelectItem>
                    <SelectItem value="9">9 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                    <SelectItem value="12">12+ years</SelectItem>
                    <SelectItem value="15">15+ years</SelectItem>
                    <SelectItem value="20">20+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.yearsOfExperience && (
                  <p className="text-xs text-red-500">{errors.yearsOfExperience.message}</p>
                )}
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
                <Label htmlFor="noticePeriod">
                  Notice Period <span className="text-orange-500 text-xs">(optional)</span>
                </Label>
                <Select
                  value={watch("noticePeriod") || "Immediate"}
                  onValueChange={(value) => setValue("noticePeriod", value)}
                >
                  <SelectTrigger id="noticePeriod">
                    <SelectValue placeholder="Select notice period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate">Immediate</SelectItem>
                    <SelectItem value="15 days">15 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="60 days">60 days</SelectItem>
                    <SelectItem value="90 days">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expectedCtc">
                  Expected CTC <span className="text-orange-500 text-xs">(optional)</span>
                </Label>
                <Input
                  id="expectedCtc"
                  placeholder="e.g. 20 LPA or $150,000"
                  {...register("expectedCtc")}
                />
              </div>
            </div>
          </div>

          {/* Unified Voice Credentials */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Unified Voice Credentials <span className="text-orange-500 text-xs">(optional)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="uvPhone">UV Phone</Label>
                <Input
                  id="uvPhone"
                  placeholder="+1 (555) 123-4567"
                  {...register("uvPhone")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uvPassword">UV Password</Label>
                <div className="relative">
                  <Input
                    id="uvPassword"
                    type={showUvPassword ? "text" : "password"}
                    placeholder="Enter UV password"
                    {...register("uvPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowUvPassword(!showUvPassword)}
                  >
                    {showUvPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Recruiter (Admin only) */}
          {isAdmin && recruiters.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Assignment
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="assignedRecruiter">Assigned Recruiter</Label>
                <Select
                  value={selectedRecruiter?.id || ""}
                  onValueChange={(value) => {
                    const rec = recruiters.find((r) => r.id === value);
                    setSelectedRecruiter(rec || null);
                    setValue("assignedRecruiter", value);
                  }}
                >
                  <SelectTrigger id="assignedRecruiter">
                    <SelectValue placeholder="Select recruiter" />
                  </SelectTrigger>
                  <SelectContent>
                    {recruiters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
