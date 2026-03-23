import {
  getAllOptimizedResumesAction,
  getRecruitersForFilterAction,
  getCandidatesForFilterAction,
} from '@/actions/resume-studio'
import { AdminResumeStudioPage } from '@/components/admin/resume-studio/admin-resume-studio-page'

export default async function AdminResumeStudioRoute() {
  const [optimizedResumes, recruiters, candidates] = await Promise.all([
    getAllOptimizedResumesAction(),
    getRecruitersForFilterAction(),
    getCandidatesForFilterAction(),
  ])

  return (
    <AdminResumeStudioPage
      optimizedResumes={optimizedResumes}
      recruiters={recruiters}
      candidates={candidates}
    />
  )
}
