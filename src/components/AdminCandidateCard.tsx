"use client";

import { ExternalLink, FileText, Mail, Phone, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminCandidateMetrics, type AdminCandidateView } from "@/lib/admin-mappers";

interface AdminCandidateCardProps {
  candidate: AdminCandidateView;
  onViewDetails: (candidateId: string) => void;
}

function getStatusVariant(status: string) {
  if (status === "Placed") {
    return "success" as const;
  }

  if (status === "Rejected") {
    return "destructive" as const;
  }

  if (status === "Offer" || status === "Interviewing") {
    return "info" as const;
  }

  return "warning" as const;
}

export function AdminCandidateCard({ candidate, onViewDetails }: AdminCandidateCardProps) {
  const metrics = getAdminCandidateMetrics(candidate);
  const initials = candidate.name
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-card">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-blue-100">
            <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
            <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-foreground">
                {candidate.name}
              </h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {candidate.title}
              </Badge>
            </div>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 hover:text-blue-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{candidate.email}</span>
              </a>
              <a href={`tel:${candidate.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:text-blue-600">
                <Phone className="h-4 w-4" />
                <span>{candidate.phone}</span>
              </a>
            </div>
          </div>

          <a
            href={candidate.linkedInUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600"
            aria-label={`Open LinkedIn profile for ${candidate.name}`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info" className="bg-blue-50 text-blue-700">
            <UserRound className="mr-1 h-3.5 w-3.5" />
            {candidate.assignedRecruiter}
          </Badge>
          <Badge variant={getStatusVariant(metrics.latestApplicationStatus)}>
            {metrics.latestApplicationStatus}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm md:grid-cols-5 dark:bg-slate-900/40">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-slate-900 dark:text-foreground">{metrics.totalApplications}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="font-semibold text-slate-900 dark:text-foreground">{metrics.activeApplications}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Interviews</p>
            <p className="font-semibold text-slate-900 dark:text-foreground">{metrics.interviewsScheduled}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Offers</p>
            <p className="font-semibold text-slate-900 dark:text-foreground">{metrics.offersExtended}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Placements</p>
            <p className="font-semibold text-yellow-600">{metrics.placements}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1 border-slate-200">
            <a href={candidate.resumeLink} target="_blank" rel="noreferrer">
              <FileText className="h-4 w-4" /> View Resume
            </a>
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => onViewDetails(candidate.id)}>
            View Full Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}