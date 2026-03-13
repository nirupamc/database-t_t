import { notFound } from "next/navigation";
import { CandidateProfile } from "@/components/candidates/candidate-profile";
import { getCurrentSession } from "@/lib/auth";
import { mapCandidateToView } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

/** Candidate detail page – /dashboard/candidates/[id] */
export default async function CandidatePage({
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

  return <CandidateProfile candidate={mapCandidateToView(candidate)} />;
}
