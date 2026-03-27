"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, MapPin, Eye, EyeOff } from "lucide-react";
import { updateCandidateAction } from "@/actions/candidates";

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  linkedIn: z.string().optional().refine(
    (val) => !val || val.includes("linkedin.com") || val.startsWith("http"),
    "Please enter a valid LinkedIn URL"
  ),
  yearsOfExperience: z.string().optional(),
  location: z.string().optional(),
  noticePeriod: z.string().optional(),
  expectedCtc: z.string().optional(),
  uvPhone: z.string().optional(),
  uvPassword: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditCandidateFormProps {
  candidate: {
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
    status: string;
    recruiterId: string;
    uvPhone: string | null;
    uvPassword: string | null;
  };
}

const skillSuggestions = [
  "Java", "Python", "React", "Node.js", "Salesforce", "AWS", "Docker",
  "Kubernetes", "Spring Boot", "TypeScript", "Apex", "Tailwind CSS",
  "DevOps", "REST APIs", "GraphQL", "MongoDB", "PostgreSQL", "DynamoDB",
];

export function EditCandidateForm({ candidate }: EditCandidateFormProps) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(candidate.skills);
  const [skillInput, setSkillInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUvPassword, setShowUvPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      linkedIn: candidate.personalLinkedIn,
      yearsOfExperience: String(candidate.experienceYears),
      location: candidate.location,
      noticePeriod: candidate.noticePeriod,
      expectedCtc: candidate.expectedCTC,
      uvPhone: candidate.uvPhone ?? "",
      uvPassword: candidate.uvPassword ?? "",
    },
  });

  const noticePeriod = watch("noticePeriod");

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setSkillInput("");
    setShowSuggestions(false);
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); }
  };

  const filtered = skillSuggestions.filter(
    (s) => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s)
  );

  const onSubmit = async (data: EditFormValues) => {
    try {
      await updateCandidateAction({
        id: candidate.id,
        fullName: data.name,
        email: data.email,
        phone: data.phone || "NA",
        personalLinkedIn: data.linkedIn
          ? (data.linkedIn.startsWith("http") ? data.linkedIn : `https://${data.linkedIn}`)
          : "",
        profilePhotoUrl: "",
        resumeUrl: "",
        skills,
        experienceYears: Number(data.yearsOfExperience || 0),
        location: data.location || "Unknown",
        noticePeriod: data.noticePeriod || "Immediate",
        expectedCTC: data.expectedCtc || "TBD",
        status: candidate.status,
        recruiterId: candidate.recruiterId,
        uvPhone: data.uvPhone || null,
        uvPassword: data.uvPassword || null,
      });

      toast.success("Candidate updated successfully!");
      router.push(`/dashboard/candidates/${candidate.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update candidate");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Candidate Profile</h1>
        <p className="text-muted-foreground">Update information for {candidate.fullName}</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Contact details and identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number <span className="text-orange-500 text-xs">(optional)</span></Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedIn">LinkedIn URL <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input id="linkedIn" placeholder="linkedin.com/in/johndoe" className="pl-8" {...register("linkedIn")} />
                <span className="absolute left-2.5 top-2 text-muted-foreground text-sm">🔗</span>
              </div>
              {errors.linkedIn && <p className="text-xs text-destructive">{errors.linkedIn.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Snapshot</CardTitle>
          <CardDescription>Skills, experience and expectations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skills */}
          <div className="space-y-1.5">
            <Label>Skills Tags <span className="text-orange-500 text-xs">(optional)</span></Label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md min-h-[42px] bg-background">
              {skills.map((skill) => (
                <Badge key={skill} className="bg-primary/10 text-primary border-primary/20 gap-1">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => { setSkillInput(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={handleSkillKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Type a skill and press Enter..."
                  className="w-full border-none outline-none text-sm bg-transparent placeholder:text-muted-foreground"
                />
                {showSuggestions && skillInput && filtered.length > 0 && (
                  <div className="absolute top-8 left-0 z-50 w-64 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
                    {filtered.map((s) => (
                      <button key={s} type="button" onClick={() => addSkill(s)}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="yearsOfExperience">Years of Experience <span className="text-orange-500 text-xs">(optional)</span></Label>
              <Input id="yearsOfExperience" type="number" {...register("yearsOfExperience")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location <span className="text-orange-500 text-xs">(optional)</span></Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="location" className="pl-8" {...register("location")} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Notice Period <span className="text-orange-500 text-xs">(optional)</span></Label>
              <Select value={noticePeriod} onValueChange={(val) => setValue("noticePeriod", val)}>
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
              <Label htmlFor="expectedCtc">Expected CTC <span className="text-orange-500 text-xs">(optional)</span></Label>
              <Input id="expectedCtc" placeholder="12,00,000" {...register("expectedCtc")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Voice Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><span>📞</span> Unified Voice Credentials</CardTitle>
          <CardDescription>Phone number and password used for Unified Voice app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="uvPhone">UV Phone Number <span className="text-orange-500 text-xs">(optional)</span></Label>
              <Input id="uvPhone" placeholder="+1 (555) 000-0000" {...register("uvPhone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uvPassword">UV Password <span className="text-orange-500 text-xs">(optional)</span></Label>
              <div className="relative">
                <Input
                  id="uvPassword"
                  type={showUvPassword ? "text" : "password"}
                  placeholder="Enter UV password"
                  className="pr-10"
                  {...register("uvPassword")}
                />
                <button type="button" onClick={() => setShowUvPassword((p) => !p)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showUvPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 pb-8">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" className="bg-primary px-8" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
