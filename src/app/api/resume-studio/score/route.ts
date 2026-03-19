import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreResume } from '@/lib/resume-ai'
import { createOptimizedResumeAction } from '@/actions/resume-studio'

export async function POST(req: NextRequest) {
  console.log('[API /api/resume-studio/score] POST request received')
  
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      console.log('[API score] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { candidateId, jobTitle, company, jobDescription } = body

    console.log('[API score] candidateId:', candidateId, 'jobTitle:', jobTitle)

    // Validation
    if (!candidateId || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: 'Job description must be at least 50 characters' }, 
        { status: 400 }
      )
    }

    // Fetch candidate
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { 
        id: true, 
        fullName: true, 
        resumeUrl: true 
      },
    })

    if (!candidate) {
      console.log('[API score] Candidate not found')
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    if (!candidate.resumeUrl) {
      console.log('[API score] No resume found for candidate')
      return NextResponse.json({ error: 'No resume found for candidate' }, { status: 400 })
    }

    console.log('[API score] Scoring resume:', candidate.resumeUrl)

    // Score the resume using AI
    const scoreResult = await scoreResume(
      candidate.resumeUrl,
      jobTitle,
      jobDescription,
      company || undefined
    )

    console.log('[API score] Score result:', scoreResult.overall)

    // Save the score to database
    const optimizedResume = await createOptimizedResumeAction({
      candidateId,
      jobTitle,
      company: company || null,
      jobDescription,
      compatibilityScore: scoreResult.overall,
      scoreBreakdown: scoreResult.breakdown,
      fitIndicator: scoreResult.fitIndicator,
      suggestions: scoreResult.suggestions,
      originalResumeUrl: candidate.resumeUrl,
    })

    console.log('[API score] Record created:', optimizedResume.id)

    return NextResponse.json({
      score: scoreResult,
      id: optimizedResume.id,
    })
    
  } catch (error) {
    console.error('[API score] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
