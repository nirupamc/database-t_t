import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { candidates } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

/** All Applications page – /dashboard/applications */
export default function ApplicationsPage() {
  // Flatten all applications across candidates
  const allApps = candidates.flatMap((c) =>
    c.applications.map((app) => ({ ...app, candidateId: c.id, candidateName: c.name }))
  );

  function statusVariant(status: string) {
    if (status.includes("Interview") || status === "In Interview") return "info" as const;
    if (status === "Offer Received" || status === "Offer Stage") return "success" as const;
    if (status === "Rejected") return "destructive" as const;
    return "warning" as const;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Applications</h1>
        <p className="text-muted-foreground">Track every job application across candidates</p>
      </div>

      <div className="grid gap-3">
        {allApps.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{app.jobTitle}</h3>
                    <span className="text-muted-foreground text-sm">@ {app.company}</span>
                    {app.jobPostingUrl && (
                      <a href={app.jobPostingUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Candidate:{" "}
                    <Link href={`/dashboard/candidates/${app.candidateId}`} className="text-primary hover:underline">
                      {app.candidateName}
                    </Link>
                    {" · "}{app.workMode}
                    {app.nextAction && ` · Next: ${app.nextAction}`}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs uppercase">{t}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={statusVariant(app.status)} className="text-xs">{app.status}</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/candidates/${app.candidateId}?tab=applications`}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
