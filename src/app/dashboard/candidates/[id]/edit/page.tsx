import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditCandidateForm } from "@/components/candidates/edit-candidate-form";

/** Edit Candidate page – /dashboard/candidates/[id]/edit */
export default async function EditCandidatePage({
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
    },
  });

  if (!candidate) {
    notFound();
  }

  // Only allow admin or the assigned recruiter to edit
  if (session.user.role !== "admin" && candidate.recruiterId !== session.user.id) {
    notFound();
  }

  // Fetch all recruiters for the assignee dropdown (admins only)
  const recruiters = session.user.role === "admin" 
    ? await prisma.recruiter.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="container max-w-3xl py-8">
      <EditCandidateForm 
        candidate={candidate} 
        recruiters={recruiters}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
