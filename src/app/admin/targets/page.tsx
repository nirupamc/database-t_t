import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getTargetsAction } from "@/actions/targets"
import { AdminTargetsPage } from "@/components/admin/targets/admin-targets-page"

export default async function TargetsRoute({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role.toUpperCase() !== "ADMIN") {
    redirect("/dashboard")
  }

  const now = new Date()
  const params = await searchParams
  const currentMonth = params.month ? Number(params.month) : now.getMonth() + 1
  const currentYear = params.year ? Number(params.year) : now.getFullYear()

  const data = await getTargetsAction(currentMonth, currentYear)

  return (
    <AdminTargetsPage
      recruiters={data}
      currentMonth={currentMonth}
      currentYear={currentYear}
    />
  )
}