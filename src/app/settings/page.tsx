import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Settings | Tantech ATS",
  description: "Manage your profile, preferences, and notifications",
};

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string; success?: string; error?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  const recruiter = await prisma.recruiter.findUnique({
    where: { id: session.user.id },
    select: { 
      name: true, 
      email: true,
      phone: true,
      calendarConnected: true,
      reminderTiming: true,
      googleTokenExpiry: true,
    },
  });

  return (
    <div className="space-y-6 p-6 md:p-8">
      <SettingsForm 
        user={{ 
          name: recruiter?.name ?? session.user.name ?? "Recruiter", 
          email: recruiter?.email ?? session.user.email ?? "",
          phone: recruiter?.phone ?? null,
        }}
        calendarConnected={recruiter?.calendarConnected ?? false}
        reminderTiming={recruiter?.reminderTiming ?? 60}
        googleTokenExpiry={recruiter?.googleTokenExpiry?.toISOString() ?? null}
        calendarParam={params.calendar}
        successMessage={params.success}
        errorMessage={params.error}
      />
    </div>
  );
}
