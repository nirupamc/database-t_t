import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { candidatesSeed, getCandidateMetrics } from "@/lib/fakeData";

export default async function AdminCandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = candidatesSeed.find((item) => item.id === id);

  if (!candidate) {
    notFound();
  }

  const metrics = getCandidateMetrics(candidate);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{candidate.name}</h1>
        <p className="text-muted-foreground">Admin candidate profile view</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <p><span className="text-muted-foreground">Email:</span> {candidate.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {candidate.phone}</p>
          <p><span className="text-muted-foreground">Recruiter:</span> {candidate.assignedRecruiter}</p>
          <p><span className="text-muted-foreground">Role:</span> {candidate.title}</p>
          <p><span className="text-muted-foreground">Experience:</span> {candidate.experienceYears} years</p>
          <p><span className="text-muted-foreground">Location:</span> {candidate.location}</p>
          <p><span className="text-muted-foreground">Notice:</span> {candidate.noticePeriod}</p>
          <p><span className="text-muted-foreground">CTC:</span> {candidate.expectedCtc}</p>
          <p><span className="text-muted-foreground">Applications:</span> {metrics.totalApplications}</p>
          <p><span className="text-muted-foreground">LinkedIn:</span> {candidate.linkedInUrl}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Resume:</span> {candidate.resumeLink}</p>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <Badge variant="outline">Active {metrics.activeApplications}</Badge>
            <Badge variant="outline">Interviews {metrics.interviewsScheduled}</Badge>
            <Badge variant="outline">Offers {metrics.offersExtended}</Badge>
            <Badge variant="outline">Placements {metrics.placements}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
