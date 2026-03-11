import { notFound } from "next/navigation";
import { candidates } from "@/lib/data";
import { CandidateProfile } from "@/components/candidates/candidate-profile";

/** Candidate detail page – /dashboard/candidates/[id] */
export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    notFound();
  }

  return <CandidateProfile candidate={candidate} />;
}

/** Generate static params for all known candidates */
export function generateStaticParams() {
  return candidates.map((c) => ({ id: c.id }));
}
