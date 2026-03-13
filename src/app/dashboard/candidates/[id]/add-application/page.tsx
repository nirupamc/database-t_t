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

  return <AddApplicationForm candidate={mapCandidateToView(candidate)} />;
}
