"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Linkedin,
  Mail,
  Phone,
  Pencil,
  FileDown,
  Code2,
  Briefcase,
  DollarSign,
  Plus,
  User,
  Eye,
  EyeOff,
  Trash2,
  X,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ApplicationsList } from "./applications-list";
import { updateCandidateAction, deleteCandidateAction } from "@/actions/candidates";
import type { Candidate } from "@/types";

/** Hero section with candidate info */
function CandidateHero({
  candidate,
  isAdmin,
  onEditClick,
  onDeleteClick,
}: {
  candidate: Candidate;
  isAdmin: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-4 border-primary/10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {candidate.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{candidate.name}</h1>
            <p className="text-primary font-medium">{candidate.title} · {candidate.yearsOfExperience}+ years exp</p>
            {/* Only show location and work mode if they have meaningful values */}
            {(candidate.location && candidate.location !== 'Unknown' && candidate.location !== 'NA') ||
             (candidate.workMode && candidate.workMode !== 'NA' && candidate.workMode !== 'Unknown') ? (
              <p className="text-sm text-muted-foreground mt-1">
                {candidate.location && candidate.location !== 'Unknown' && candidate.location !== 'NA' && (
                  <>📍 {candidate.location}</>
                )}
                {candidate.location && candidate.location !== 'Unknown' && candidate.location !== 'NA' &&
                 candidate.workMode && candidate.workMode !== 'NA' && candidate.workMode !== 'Unknown' && (
                  <> · </>
                )}
                {candidate.workMode && candidate.workMode !== 'NA' && candidate.workMode !== 'Unknown' && (
                  <>Open to {candidate.workMode}</>
                )}
              </p>
            ) : null}

            {/* Contact icons */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {candidate.linkedIn && (
                <a href={`https://${candidate.linkedIn}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              <a href={`mailto:${candidate.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
              </a>
              <a href={`tel:${candidate.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
              </a>
              {/* Only show employment badges if they have meaningful values */}
              {candidate.workType && candidate.workType !== 'NA' && candidate.workType !== 'Unknown' && (
                <Badge variant="outline" className="text-xs">{candidate.workType.toUpperCase()}</Badge>
              )}
              {candidate.workMode && candidate.workMode !== 'NA' && candidate.workMode !== 'Unknown' && (
                <Badge variant="outline" className="text-xs">{candidate.workMode.toUpperCase()}</Badge>
              )}
            </div>

            {/* Assigned recruiter */}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="gap-1.5">
                <User className="h-3 w-3" />
                Assigned to: {candidate.assignedRecruiter}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <Pencil className="h-4 w-4 mr-1" /> Edit Profile
            </Button>
            <Button size="sm" className="bg-primary">
              <FileDown className="h-4 w-4 mr-1" /> Export PDF
            </Button>
            {isAdmin && (
              <Button size="sm" variant="destructive" onClick={onDeleteClick}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Inline edit dialog */
function EditDialog({
  candidate,
  open,
  onClose,
}: {
  candidate: Candidate;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(candidate.skills);
  const [skillInput, setSkillInput] = useState("");
  const [name, setName] = useState(candidate.name);
  const [email, setEmail] = useState(candidate.email);
  const [phone, setPhone] = useState(candidate.phone);
  const [linkedIn, setLinkedIn] = useState(candidate.linkedIn);
  const [location, setLocation] = useState(candidate.location);
  const [yearsExp, setYearsExp] = useState(String(candidate.yearsOfExperience));
  const [noticePeriod, setNoticePeriod] = useState(candidate.noticePeriod);
  const [expectedCtc, setExpectedCtc] = useState(candidate.expectedCtc);
  const [uvPhone, setUvPhone] = useState(candidate.uvPhone ?? "");
  const [uvPassword, setUvPassword] = useState(candidate.uvPassword ?? "");
  const [showUvPw, setShowUvPw] = useState(false);
  const [employmentType, setEmploymentType] = useState(candidate.employmentType ?? "");
  const [workMode, setWorkMode] = useState(candidate.workMode ?? "");
  const [candidateType, setCandidateType] = useState(candidate.candidateType ?? "");
  const [saving, setSaving] = useState(false);

  const skillSuggestions = ["Java","Python","React","Node.js","Salesforce","AWS","Docker","Kubernetes","Spring Boot","TypeScript","Apex","DevOps","REST APIs","GraphQL","MongoDB","PostgreSQL"];
  const filtered = skillSuggestions.filter((s) => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s));

  const addSkill = (skill: string) => {
    const t = skill.trim();
    if (t && !skills.includes(t)) setSkills([...skills, t]);
    setSkillInput("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCandidateAction({
        id: candidate.id,
        fullName: name,
        email,
        phone: phone || "NA",
        personalLinkedIn: linkedIn
          ? (linkedIn.startsWith("http") ? linkedIn : `https://${linkedIn}`)
          : "",
        profilePhotoUrl: "",
        resumeUrl: "",
        skills,
        experienceYears: Number(yearsExp || 0),
        location: location || "Unknown",
        noticePeriod: noticePeriod || "Immediate",
        expectedCTC: expectedCtc || "TBD",
        status: "ACTIVE",
        recruiterId: "", // server-action preserves existing recruiterId for non-admins
        uvPhone: uvPhone || null,
        uvPassword: uvPassword || null,
        employmentType: employmentType || null,
        workMode: workMode || null,
        candidateType: candidateType || null,
      });
      toast.success("Profile updated!");
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Candidate Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Personal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn URL</Label>
              <div className="relative">
                <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} className="pl-8" />
                <span className="absolute left-2.5 top-2 text-muted-foreground text-sm">🔗</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <Label>Skills</Label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md min-h-[42px] bg-background">
              {skills.map((s) => (
                <Badge key={s} className="bg-primary/10 text-primary border-primary/20 gap-1">
                  {s}
                  <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="relative flex-1 min-w-[160px]">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); } }}
                  onBlur={() => setTimeout(() => setSkillInput(""), 200)}
                  placeholder="Add skill..."
                  className="w-full border-none outline-none text-sm bg-transparent placeholder:text-muted-foreground"
                />
                {skillInput && filtered.length > 0 && (
                  <div className="absolute top-8 left-0 z-50 w-56 bg-popover border rounded-md shadow-md max-h-36 overflow-auto">
                    {filtered.map((s) => (
                      <button key={s} type="button" onMouseDown={() => addSkill(s)}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Years of Experience</Label>
              <Input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notice Period</Label>
              <Select value={noticePeriod} onValueChange={setNoticePeriod}>
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
              <Label>Expected CTC</Label>
              <Input value={expectedCtc} onChange={(e) => setExpectedCtc(e.target.value)} />
            </div>
          </div>

          {/* UV Credentials */}
          <div className="border rounded-lg p-4 space-y-4">
            <p className="font-semibold text-sm flex items-center gap-2"><span>📞</span> Unified Voice Credentials</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>UV Phone</Label>
                <Input value={uvPhone} onChange={(e) => setUvPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>UV Password</Label>
                <div className="relative">
                  <Input
                    type={showUvPw ? "text" : "password"}
                    value={uvPassword}
                    onChange={(e) => setUvPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowUvPw((p) => !p)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showUvPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Preferences */}
          <div className="border rounded-lg p-4 space-y-4">
            <p className="font-semibold text-sm">Employment Preferences</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Employment Type</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                    <SelectItem value="PART_TIME">Part-Time</SelectItem>
                    <SelectItem value="FREELANCE">Freelance</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Work Mode</Label>
                <Select value={workMode} onValueChange={setWorkMode}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="ON_SITE">On-Site</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="REMOTE">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Candidate Type</Label>
                <Select value={candidateType} onValueChange={setCandidateType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="OPT">OPT</SelectItem>
                    <SelectItem value="FULL_TIME">Full-Time Employee</SelectItem>
                    <SelectItem value="C2C">C2C (Contractor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation dialog */
function DeleteDialog({
  candidateName,
  candidateId,
  open,
  onClose,
}: {
  candidateName: string;
  candidateId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCandidateAction(candidateId);
      toast.success("Candidate deleted");
      router.push("/admin/candidates");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Candidate?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{candidateName}</strong>? This will remove all their applications and data permanently.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Profile tab — skills, notice period, CTC etc. */
function ProfileTab({ candidate }: { candidate: Candidate }) {
  const [showUvPassword, setShowUvPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Skills */}
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Skills</p>
              <p className="text-sm font-medium">{candidate.skills.join(", ")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notice Period */}
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notice Period</p>
              <p className="text-sm font-medium">{candidate.noticePeriod}</p>
            </div>
          </CardContent>
        </Card>

        {/* Current CTC */}
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current CTC</p>
              <p className="text-sm font-medium">{candidate.currentCtc}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Preferences */}
      {(candidate.employmentType || candidate.workMode || candidate.candidateType) && (
        <Card>
          <CardContent className="p-5">
            <p className="font-semibold text-sm mb-3">Employment Preferences</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {candidate.employmentType && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Employment Type</p>
                  <p className="text-sm font-medium">{candidate.employmentType.replace(/_/g, "-")}</p>
                </div>
              )}
              {candidate.workMode && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Work Mode</p>
                  <p className="text-sm font-medium">{candidate.workMode.replace(/_/g, "-")}</p>
                </div>
              )}
              {candidate.candidateType && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Candidate Type</p>
                  <p className="text-sm font-medium">{candidate.candidateType === "C2C" ? "C2C" : candidate.candidateType.replace(/_/g, "-")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Voice Credentials */}
      {(candidate.uvPhone || candidate.uvPassword) && (
        <Card className="border-yellow-200 dark:border-yellow-800/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📞</span>
              <p className="font-semibold text-sm">Unified Voice Credentials</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {candidate.uvPhone && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">UV Phone</p>
                  <p className="text-sm font-medium font-mono">{candidate.uvPhone}</p>
                </div>
              )}
              {candidate.uvPassword && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">UV Password</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium font-mono">
                      {showUvPassword ? candidate.uvPassword : "••••••••"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowUvPassword((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showUvPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Notes tab */
function NotesTab({ candidate }: { candidate: Candidate }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold">Quick Notes</h3>
        <Textarea
          defaultValue={candidate.notes}
          placeholder="Add notes about this candidate..."
          className="min-h-[160px]"
        />
        <Button size="sm" onClick={() => toast.success("Notes saved!")}>Save Notes</Button>
      </CardContent>
    </Card>
  );
}

/** Full candidate profile view with tabs */
export function CandidateProfile({ candidate, isAdmin = false }: { candidate: Candidate; isAdmin?: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <CandidateHero
        candidate={candidate}
        isAdmin={isAdmin}
        onEditClick={() => setEditOpen(true)}
        onDeleteClick={() => setDeleteOpen(true)}
      />

      {/* Edit dialog */}
      <EditDialog candidate={candidate} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Delete dialog (admin only) */}
      {isAdmin && (
        <DeleteDialog
          candidateName={candidate.name}
          candidateId={candidate.id}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="applications">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profile">
            📝 Profile
          </TabsTrigger>
          <TabsTrigger value="applications">
            📋 Applications
            <Badge variant="info" className="ml-1.5 text-xs px-1.5 py-0">
              {candidate.applications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="notes">
            📒 Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab candidate={candidate} />
        </TabsContent>

        <TabsContent value="applications" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Applications
              <Badge variant="success" className="ml-2 text-xs">
                {candidate.applications.length} Active
              </Badge>
            </h2>
            <Button className="bg-primary" size="sm" asChild>
              <Link href={`/dashboard/candidates/${candidate.id}/add-application`}>
                <Plus className="h-4 w-4 mr-1" /> New Application
              </Link>
            </Button>
          </div>
          <ApplicationsList applications={candidate.applications} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesTab candidate={candidate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
