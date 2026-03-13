import { notFound } from "next/navigation";

import { getCandidateByIdAction } from "@/actions/candidates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminCandidateMetrics, mapCandidateToAdminView } from "@/lib/admin-mappers";

export default async function AdminCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidateByIdAction(id);

  if (!candidate) {
    notFound();
  }

  const candidateView = mapCandidateToAdminView(candidate);
  const metrics = getAdminCandidateMetrics(candidateView);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{candidateView.name}</h1>
        <p className="text-muted-foreground">Admin Candidate Details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <p><span className="text-muted-foreground">Title:</span> {candidateView.title}</p>
          <p><span className="text-muted-foreground">Email:</span> {candidateView.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {candidateView.phone}</p>
          <p><span className="text-muted-foreground">LinkedIn:</span> {candidateView.linkedInUrl}</p>
          <p><span className="text-muted-foreground">Recruiter:</span> {candidateView.assignedRecruiter}</p>
          <p><span className="text-muted-foreground">Location:</span> {candidateView.location}</p>
          <p><span className="text-muted-foreground">Experience:</span> {candidateView.experienceYears} years</p>
          <p><span className="text-muted-foreground">Notice:</span> {candidateView.noticePeriod}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Resume:</span> {candidateView.resumeLink}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funnel Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">Total {metrics.totalApplications}</Badge>
          <Badge variant="outline">Active {metrics.activeApplications}</Badge>
          <Badge variant="outline">Interviews {metrics.interviewsScheduled}</Badge>
          <Badge variant="outline">Offers {metrics.offersExtended}</Badge>
          <Badge variant="outline">Placements {metrics.placements}</Badge>
          <Badge variant="info">Latest {metrics.latestApplicationStatus}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
