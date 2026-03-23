import {
  getAllOptimizedResumesAction,
  getRecruitersForFilterAction,
  getCandidatesForFilterAction,
} from '@/actions/resume-studio'
import { AdminResumeStudioPage } from '@/components/admin/resume-studio/admin-resume-studio-page'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

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
