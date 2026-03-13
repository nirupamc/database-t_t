import { notFound } from "next/navigation";

import { getEmployeeByIdAction, listEmployeesAction } from "@/actions/employees";
import { AdminEmployeeDetailClient } from "@/components/AdminEmployeeDetailClient";
import { mapRecruiterToAdminView } from "@/lib/admin-mappers";

export default async function AdminEmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [employee, employees] = await Promise.all([getEmployeeByIdAction(id), listEmployeesAction()]);

  if (!employee) {
    notFound();
  }

  const currentEmployee = mapRecruiterToAdminView(employee);
  const recruiterOptions = employees
    .map(mapRecruiterToAdminView)
    .filter((item) => item.role === "Recruiter" && item.id !== currentEmployee.id)
    .map((item) => ({ id: item.id, name: item.name }));

  return <AdminEmployeeDetailClient employee={currentEmployee} recruiterOptions={recruiterOptions} />;
}
