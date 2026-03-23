import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResumeStudioPage } from "@/components/resume-studio/resume-studio-page";
import { notFound } from "next/navigation";

/** Resume Studio page - /dashboard/resume-studio */
export default async function ResumeStudioPageServer() {
  console.log('[ResumeStudio] Page loading...');
  
  const session = await getCurrentSession();
  if (!session?.user) {
    console.log('[ResumeStudio] No session, redirecting');
    notFound();
  }

  console.log('[ResumeStudio] User role:', session.user.role, 'ID:', session.user.id);

  // Admin sees all candidates, recruiters see only their assigned candidates
  const candidates = await prisma.candidate.findMany({
    where: session.user.role === 'admin'
      ? {} // Admin sees all
      : { recruiterId: session.user.id }, // Recruiter sees only assigned
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

  return <ResumeStudioPage candidates={candidates} />;
}