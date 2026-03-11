import Link from "next/link";
import { Button } from "@/components/ui/button";

/** 404 – Candidate not found */
export default function CandidateNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h2 className="text-2xl font-bold mb-2">Candidate Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The candidate you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/dashboard/candidates">Back to Candidates</Link>
      </Button>
    </div>
  );
}
