import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromDocx, scoreResume } from '@/lib/resume-ai'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  console.log('[ResumeStudio/Score] Route hit')
  
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { candidateId, jobTitle, company, jobDescription } = 
      await request.json()

    if (!candidateId || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: 'candidateId, jobTitle and jobDescription are required' },
        { status: 400 }
      )
    }

    // Get candidate with resume URL
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, fullName: true, resumeUrl: true }
    })

    if (!candidate?.resumeUrl) {
      return NextResponse.json(
        { error: 'Candidate has no resume uploaded' },
        { status: 400 }
      )
    }

    // Extract text from DOCX
    const resumeText = await extractTextFromDocx(candidate.resumeUrl)
    
    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from resume' },
        { status: 400 }
      )
    }

    // Score with AI
    const scoreResult = await scoreResume(resumeText, jobDescription)

    // Save to DB
    const optimizedResume = await prisma.optimizedResume.create({
      data: {
        candidateId,
        recruiterId: session.user.id,
        jobTitle,
        company: company || null,
        jobDescription,
        originalResumeUrl: candidate.resumeUrl,
        compatibilityScore: scoreResult.overall,
        scoreBreakdown: scoreResult as object,
        status: 'SCORED',
      }
    })

    console.log('[ResumeStudio/Score] Saved score:', optimizedResume.id)

    return NextResponse.json({
      id: optimizedResume.id,
      score: scoreResult,
      candidateName: candidate.fullName,
    })

  } catch (error) {
    console.error('[ResumeStudio/Score] Error:', error)
    return NextResponse.json(
      { error: 'Scoring failed. Please try again.' },
      { status: 500 }
    )
  }
}
