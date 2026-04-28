import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminCandidateMetrics, mapCandidateToAdminView } from "@/lib/admin-mappers";
import { prisma } from "@/lib/prisma";

export default async function AdminCandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      recruiter: true,
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          rounds: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  const profile = mapCandidateToAdminView(candidate);
  const metrics = getAdminCandidateMetrics(profile);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
        <p className="text-muted-foreground">Admin candidate profile view</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <p><span className="text-muted-foreground">Email:</span> {profile.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {profile.phone}</p>
          <p><span className="text-muted-foreground">Recruiter:</span> {profile.assignedRecruiter}</p>
          <p><span className="text-muted-foreground">Role:</span> {profile.title}</p>
          <p><span className="text-muted-foreground">Experience:</span> {profile.experienceYears} years</p>
          <p><span className="text-muted-foreground">Location:</span> {profile.location}</p>
          <p><span className="text-muted-foreground">Notice:</span> {profile.noticePeriod}</p>
          <p><span className="text-muted-foreground">CTC:</span> {profile.expectedCtc}</p>
          <p><span className="text-muted-foreground">Applications:</span> {metrics.totalApplications}</p>
          <p><span className="text-muted-foreground">LinkedIn:</span> {profile.linkedInUrl}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Resume:</span> {profile.resumeLink}</p>
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
