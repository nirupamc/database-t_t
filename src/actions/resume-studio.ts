'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './_helpers'

/**
 * Fetch all optimized resumes for a candidate
 */
export async function getOptimizedResumesAction(candidateId: string) {
  console.log('[getOptimizedResumesAction] candidateId:', candidateId)
  
  try {
    await requireAuth()
    
    // Debug: Check if prisma.optimizedResume exists
    if (!prisma.optimizedResume) {
      console.error('[getOptimizedResumesAction] ERROR: prisma.optimizedResume is undefined!')
      console.error('[getOptimizedResumesAction] Available models:', Object.keys(prisma))
      throw new Error('OptimizedResume model not found in Prisma client. Run: npx prisma generate')
    }
    
    const optimizedResumes = await prisma.optimizedResume.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        jobTitle: true,
        company: true,
        compatibilityScore: true,
        scoreBreakdown: true,
        status: true,
        originalResumeUrl: true,
        optimizedResumeUrl: true,
        atsResumeUrl: true,
        formattedResumeUrl: true,
        createdAt: true,
      },
    })

    console.log('[getOptimizedResumesAction] Found records:', optimizedResumes.length)
    return optimizedResumes
    
  } catch (error) {
    console.error('[getOptimizedResumesAction] Error:', error)
    console.error('[getOptimizedResumesAction] Error details:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error(`Failed to fetch optimized resumes: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete an optimized resume record
 */
export async function deleteOptimizedResumeAction(id: string) {
  console.log('[deleteOptimizedResumeAction] id:', id)
  
  try {
    await requireAuth()
    
    // Delete the record from database
    await prisma.optimizedResume.delete({
      where: { id }
    })

    console.log('[deleteOptimizedResumeAction] Record deleted successfully')
    return { success: true }
    
  } catch (error) {
    console.error('[deleteOptimizedResumeAction] Error:', error)
    throw new Error('Failed to delete optimized resume record')
  }
}

/**
 * Create a new optimized resume record (used by API routes)
 */
export async function createOptimizedResumeAction(data: {
  candidateId: string
  jobTitle: string
  company: string | null
  jobDescription: string
  compatibilityScore: number
  scoreBreakdown: any
  fitIndicator: string
  suggestions: string[]
  originalResumeUrl: string
}) {
  console.log('[createOptimizedResumeAction] candidateId:', data.candidateId)
  
  try {
    const user = await requireAuth()
    
    // Debug: Check if prisma.optimizedResume exists
    if (!prisma.optimizedResume) {
      console.error('[createOptimizedResumeAction] ERROR: prisma.optimizedResume is undefined!')
      console.error('[createOptimizedResumeAction] Available models:', Object.keys(prisma))
      throw new Error('OptimizedResume model not found in Prisma client. Run: npx prisma generate')
    }
    
    const optimizedResume = await prisma.optimizedResume.create({
      data: {
        candidateId: data.candidateId,
        recruiterId: user.id,
        jobTitle: data.jobTitle,
        company: data.company,
        jobDescription: data.jobDescription,
        compatibilityScore: data.compatibilityScore,
        scoreBreakdown: data.scoreBreakdown,
        fitIndicator: data.fitIndicator,
        suggestions: data.suggestions,
        originalResumeUrl: data.originalResumeUrl,
        status: 'SCORED',
      },
    })

    console.log('[createOptimizedResumeAction] Record created:', optimizedResume.id)
    return optimizedResume
    
  } catch (error) {
    console.error('[createOptimizedResumeAction] Error:', error)
    console.error('[createOptimizedResumeAction] Error details:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error(`Failed to create optimized resume record: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update optimized resume with optimization results
 */
export async function updateOptimizedResumeAction(
  id: string,
  data: {
    optimizedResumeUrl?: string
    atsResumeUrl?: string
    formattedResumeUrl?: string
    compatibilityScore: number
    scoreBreakdown: any
  }
) {
  console.log('[updateOptimizedResumeAction] id:', id)

  try {
    await requireAuth()

    const optimizedResume = await prisma.optimizedResume.update({
      where: { id },
      data: {
        ...(data.optimizedResumeUrl && { optimizedResumeUrl: data.optimizedResumeUrl }),
        ...(data.atsResumeUrl && { atsResumeUrl: data.atsResumeUrl }),
        ...(data.formattedResumeUrl && { formattedResumeUrl: data.formattedResumeUrl }),
        compatibilityScore: data.compatibilityScore,
        scoreBreakdown: data.scoreBreakdown,
        status: 'OPTIMIZED',
      },
    })

    console.log('[updateOptimizedResumeAction] Record updated:', optimizedResume.id)
    return optimizedResume

  } catch (error) {
    console.error('[updateOptimizedResumeAction] Error:', error)
    throw new Error('Failed to update optimized resume record')
  }
}

/**
 * Get all optimized resumes across all candidates (for admin)
 */
export async function getAllOptimizedResumesAction(filters?: {
  recruiterId?: string
  candidateId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}) {
  console.log('[getAllOptimizedResumesAction] filters:', filters)

  try {
    await requireAuth()

    const optimizedResumes = await prisma.optimizedResume.findMany({
      where: {
        ...(filters?.recruiterId && {
          recruiterId: filters.recruiterId
        }),
        ...(filters?.candidateId && {
          candidateId: filters.candidateId
        }),
        ...(filters?.status && {
          status: filters.status as 'SCORED' | 'OPTIMIZED'
        }),
        ...(filters?.dateFrom && {
          createdAt: {
            gte: new Date(filters.dateFrom),
            ...(filters?.dateTo && {
              lte: new Date(filters.dateTo)
            })
          }
        }),
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            skills: true,
          }
        },
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('[getAllOptimizedResumesAction] Found records:', optimizedResumes.length)
    return optimizedResumes

  } catch (error) {
    console.error('[getAllOptimizedResumesAction] Error:', error)
    throw new Error('Failed to fetch all optimized resumes')
  }
}

/**
 * Get all recruiters for filter dropdown (admin)
 */
export async function getRecruitersForFilterAction() {
  console.log('[getRecruitersForFilterAction] Fetching recruiters')

  try {
    await requireAuth()

    const recruiters = await prisma.recruiter.findMany({
      where: { role: 'RECRUITER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    })

    console.log('[getRecruitersForFilterAction] Found recruiters:', recruiters.length)
    return recruiters

  } catch (error) {
    console.error('[getRecruitersForFilterAction] Error:', error)
    throw new Error('Failed to fetch recruiters')
  }
}

/**
 * Get all candidates for filter dropdown (admin)
 */
export async function getCandidatesForFilterAction() {
  console.log('[getCandidatesForFilterAction] Fetching candidates')

  try {
    await requireAuth()

    const candidates = await prisma.candidate.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' }
    })

    console.log('[getCandidatesForFilterAction] Found candidates:', candidates.length)
    return candidates

  } catch (error) {
    console.error('[getCandidatesForFilterAction] Error:', error)
    throw new Error('Failed to fetch candidates')
  }
}