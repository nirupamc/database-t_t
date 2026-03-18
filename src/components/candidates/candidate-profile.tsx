"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Linkedin,
  Mail,
  Phone,
  Pencil,
  FileDown,
  FileText,
  Code2,
  Briefcase,
  DollarSign,
  Plus,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ApplicationsList } from "./applications-list";
import type { Candidate } from "@/types";

/** Hero section with candidate info */
function CandidateHero({ candidate }: { candidate: Candidate }) {
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
            <p className="text-sm text-muted-foreground mt-1">
              📍 {candidate.location} · Open to {candidate.workMode}
            </p>

            {/* Contact icons */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <a href={`https://${candidate.linkedIn}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href={`mailto:${candidate.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
              </a>
              <a href={`tel:${candidate.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
              </a>
              <Badge variant="outline" className="text-xs">{candidate.workType.toUpperCase()}</Badge>
              <Badge variant="outline" className="text-xs">{candidate.workMode.toUpperCase()}</Badge>
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
          <div className="flex gap-2 shrink-0 flex-wrap">
            {candidate.resumeUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => window.open(
                  `https://docs.google.com/viewer?url=${encodeURIComponent(candidate.resumeUrl)}`,
                  '_blank'
                )}
              >
                <FileText className="h-4 w-4 mr-1" /> View Resume
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled className="opacity-50">
                <FileText className="h-4 w-4 mr-1" /> No Resume
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" /> Edit Profile
            </Button>
            <Button size="sm" className="bg-primary">
              <FileDown className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current CTC</p>
              <p className="text-sm font-medium">{candidate.currentCtc}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
export function CandidateProfile({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <CandidateHero candidate={candidate} />

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
