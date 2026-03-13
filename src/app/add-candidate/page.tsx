import { AddCandidateForm } from "@/components/candidates/add-candidate-form";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Add New Candidate page – /add-candidate */
export default async function AddCandidatePage() {
  const session = await getCurrentSession();
  const recruiters = await prisma.recruiter.findMany({
    where:
      session?.user?.role === "admin"
        ? {}
        : {
            id: session?.user?.id,
          },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return <AddCandidateForm recruiters={recruiters} />;
}
