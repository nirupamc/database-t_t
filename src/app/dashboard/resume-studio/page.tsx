import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResumeStudioPage } from "@/components/resume-studio/resume-studio-page";

/** Resume Studio page – /dashboard/resume-studio */
export default async function ResumeStudioRoute() {
  console.log('[ResumeStudio] Page loading...');
  
  const session = await getCurrentSession();
  if (!session?.user) {
    console.log('[ResumeStudio] No session, redirecting to login');
    redirect("/login");
  }

  console.log('[ResumeStudio] User role:', session.user.role, 'ID:', session.user.id);

  const isAdmin = session.user.role === 'admin';

  // Admin sees all candidates, recruiters see only their assigned candidates
  const candidates = await prisma.candidate.findMany({
    where: isAdmin ? {} : { recruiterId: session.user.id },
    select: {
      id: true,
      fullName: true,
      resumeUrl: true,
      skills: true,
      experienceYears: true,
    },
    orderBy: { fullName: 'asc' }
  });

  console.log('[ResumeStudio] Found candidates:', candidates.length);

  return (
    <ResumeStudioPage 
      candidates={candidates}
      isAdmin={isAdmin}
    />
  );
}