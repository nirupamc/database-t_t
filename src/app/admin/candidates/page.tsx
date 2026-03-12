import { listCandidatesAction } from "@/actions/candidates";
import { listEmployeesAction } from "@/actions/employees";
import { AdminCandidatesPageClient } from "@/components/AdminCandidatesPageClient";
import { mapCandidateToAdminView, mapRecruiterToAdminView } from "@/lib/admin-mappers";

export default async function AdminCandidatesPage() {
  const [candidates, employees] = await Promise.all([listCandidatesAction(), listEmployeesAction()]);

  const recruiterOptions = employees
    .map(mapRecruiterToAdminView)
    .filter((employee) => employee.role === "Recruiter")
    .map((employee) => ({ id: employee.id, name: employee.name }));

  return (
    <AdminCandidatesPageClient
      initialCandidates={candidates.map(mapCandidateToAdminView)}
      recruiterOptions={recruiterOptions}
    />
  );
}