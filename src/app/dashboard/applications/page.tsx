import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** All Applications page – /dashboard/applications */
// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const applications = await prisma.application.findMany({
    where:
      session.user.role.toUpperCase() === "ADMIN"
        ? {}
        : {
            candidate: {
              recruiterId: session.user.id,
            },
          },
    include: {
      candidate: true,
    },
    orderBy: { appliedDate: "desc" },
  });

  const allApps = applications.map((app) => ({
    id: app.id,
    jobTitle: app.jobTitle,
    company: app.company,
    jobPostingUrl: app.jobUrl,
    status: app.status.replaceAll("_", " "),
    workMode: "Hybrid",
    tags: app.techTags,
    nextAction: undefined,
    candidateId: app.candidateId,
    candidateName: app.candidate.fullName,
  }));

  function statusVariant(status: string) {
    if (status.includes("INTERVIEW") || status === "In Interview") return "info" as const;
    if (status.includes("OFFER") || status === "PLACED") return "success" as const;
    if (status.includes("REJECTED")) return "destructive" as const;
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
