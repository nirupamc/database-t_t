import { notFound } from "next/navigation";
import { candidates } from "@/lib/data";
import { AddApplicationForm } from "@/components/applications/add-application-form";

/** Add Application page – /dashboard/candidates/[id]/add-application */
export default async function AddApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    notFound();
  }

  return <AddApplicationForm candidate={candidate} />;
}
