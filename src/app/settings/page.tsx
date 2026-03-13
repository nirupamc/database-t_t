import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Settings | HireFlow",
  description: "Manage your profile, preferences, and notifications",
};

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const recruiter = await prisma.recruiter.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="space-y-6 p-6 md:p-8">
      <SettingsForm user={{ name: recruiter?.name ?? session.user.name ?? "Recruiter", email: recruiter?.email ?? session.user.email ?? "" }} />
    </div>
  );
}
