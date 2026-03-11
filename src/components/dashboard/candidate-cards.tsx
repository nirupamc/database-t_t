import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays } from "lucide-react";
import { candidates } from "@/lib/data";
import type { ApplicationStatus } from "@/types";

/** Map application status to badge variant */
function statusVariant(status: ApplicationStatus) {
  switch (status) {
    case "In Interview":
    case "Interview Scheduled":
      return "info" as const;
    case "Technical Interview":
      return "default" as const;
    case "HR Screen":
      return "warning" as const;
    case "Offer Stage":
    case "Offer Received":
      return "success" as const;
    case "Rejected":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

/** Recent candidates grid (first 3) */
export function CandidateCards() {
  // Show first 3 candidates who have applications
  const recent = candidates.filter((c) => c.applications.length > 0).slice(0, 3);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recent.map((candidate) => {
        // Pick the latest (first) application status
        const latestApp = candidate.applications[0];
        return (
          <Card key={candidate.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5">
              {/* Header: avatar + status badge */}
              <div className="flex items-start justify-between mb-4">
                <Avatar className="h-14 w-14 border-2 border-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {candidate.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {latestApp && (
                  <Badge variant={statusVariant(latestApp.status)} className="text-xs">
                    {latestApp.status}
                  </Badge>
                )}
              </div>

              {/* Name */}
              <h3 className="font-semibold text-lg">{candidate.name}</h3>

              {/* Skills tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {candidate.skills.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs font-normal uppercase tracking-wide">
                    {skill}
                  </Badge>
                ))}
              </div>

              {/* Next round info */}
              {latestApp?.rounds?.[0] && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">
                    Next Round:{" "}
                    {new Date(latestApp.rounds[0].date).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    {latestApp.rounds[0].time}
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="gap-2 border-t bg-muted/40 px-5 py-3">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/dashboard/candidates/${candidate.id}`}>View Profile</Link>
              </Button>
              <Button size="sm" className="flex-1 bg-primary" asChild>
                <Link href={`/dashboard/candidates/${candidate.id}?tab=applications`}>Add Application</Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
