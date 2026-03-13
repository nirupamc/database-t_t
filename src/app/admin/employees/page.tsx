import { listEmployeesAction } from "@/actions/employees";
import { AdminEmployeesPageClient } from "@/components/AdminEmployeesPageClient";
import { mapRecruiterToAdminView } from "@/lib/admin-mappers";

export default async function AdminEmployeesPage() {
  const employees = await listEmployeesAction();
  return <AdminEmployeesPageClient initialEmployees={employees.map(mapRecruiterToAdminView)} />;
}
