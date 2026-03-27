import { AddCandidateForm } from "@/components/candidates/add-candidate-form";
import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/** Add New Candidate page – /add-candidate */
// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function AddCandidatePage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const recruiters = await prisma.recruiter.findMany({
    where:
      session.user.role.toUpperCase() === "ADMIN"
        ? {}
        : {
            id: session.user.id,
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
