import { notFound } from "next/navigation";
import { AddApplicationForm } from "@/components/applications/add-application-form";
import { getCurrentSession } from "@/lib/auth";
import { mapCandidateToView } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

/** Add Application page – /dashboard/candidates/[id]/add-application */
export default async function AddApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session?.user) {
    notFound();
  }

  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      recruiter: true,
      applications: {
        include: { rounds: true },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  if (session.user.role !== "admin" && candidate.recruiterId !== session.user.id) {
    notFound();
  }

  // Fetch optimized resumes for this candidate
  const optimizedResumes = await prisma.optimizedResume.findMany({
    where: {
      candidateId: id,
      status: 'OPTIMIZED',
      OR: [
        { atsResumeUrl: { not: null } },
        { formattedResumeUrl: { not: null } },
        { optimizedResumeUrl: { not: null } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      jobTitle: true,
      company: true,
      compatibilityScore: true,
      atsResumeUrl: true,
      formattedResumeUrl: true,
      optimizedResumeUrl: true,
      createdAt: true,
    }
  });

  return (
    <AddApplicationForm
      candidate={mapCandidateToView(candidate)}
      originalResumeUrl={candidate.resumeUrl ?? null}
      optimizedResumes={optimizedResumes}
    />
  );
}
