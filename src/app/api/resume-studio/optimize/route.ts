import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTextFromDocx, optimizeResumeText, scoreResume } from '@/lib/resume-ai'
import { generateOptimizedResumeDocx } from '@/lib/resume-docx'
import { put } from '@vercel/blob'
import { updateOptimizedResumeAction } from '@/actions/resume-studio'

export async function POST(req: NextRequest) {
  console.log('[API /api/resume-studio/optimize] POST request received')
  
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      console.log('[API optimize] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { optimizedResumeId } = body

    console.log('[API optimize] optimizedResumeId:', optimizedResumeId)

    if (!optimizedResumeId) {
      return NextResponse.json(
        { error: 'Missing optimizedResumeId' }, 
        { status: 400 }
      )
    }

    // Fetch the existing record
    const record = await prisma.optimizedResume.findUnique({
      where: { id: optimizedResumeId },
      include: {
        candidate: {
          select: { fullName: true, resumeUrl: true },
        },
      },
    })

    if (!record) {
      console.log('[API optimize] Record not found')
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    if (!record.candidate.resumeUrl) {
      console.log('[API optimize] No resume URL')
      return NextResponse.json({ error: 'No resume URL' }, { status: 400 })
    }

    console.log('[API optimize] Optimizing resume for:', record.candidate.fullName)

    // Extract original resume text
    const resumeText = await extractTextFromDocx(record.candidate.resumeUrl)
    console.log('[API optimize] Extracted resume text length:', resumeText.length)

    // Use stored score breakdown + suggestions from the scoring step
    const scoreBreakdownWithSuggestions = {
      ...(record.scoreBreakdown as any),
      suggestions: record.suggestions as string[] | undefined,
    }

    // Generate optimized resume text using AI
    const optimizedText = await optimizeResumeText(
      resumeText,
      record.jobTitle,
      record.jobDescription,
      scoreBreakdownWithSuggestions,
      record.company || undefined
    )

    console.log('[API optimize] Generated optimized text, length:', optimizedText.length)

    // Generate DOCX file
    const docxBuffer = await generateOptimizedResumeDocx(
      optimizedText,
      record.candidate.fullName,
      record.jobTitle,
      record.company || undefined
    )

    console.log('[API optimize] Generated DOCX, size:', docxBuffer.byteLength)

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const filename = `resume-optimized-${record.candidate.fullName.replace(/\s+/g, '-')}-${timestamp}.docx`
    
    const blob = await put(filename, docxBuffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    console.log('[API optimize] Uploaded to Blob:', blob.url)

    // Re-score the optimized resume to get updated score
    const newScoreResult = await scoreResume(
      optimizedText,
      record.jobTitle,
      record.jobDescription,
      record.company || undefined
    )

    console.log('[API optimize] Re-scored optimized resume:', newScoreResult.overall)

    // Update the record with optimized resume URL and new score
    const updatedRecord = await updateOptimizedResumeAction(optimizedResumeId, {
      optimizedResumeUrl: blob.url,
      compatibilityScore: newScoreResult.overall,
      scoreBreakdown: newScoreResult.breakdown,
    })

    console.log('[API optimize] Record updated successfully')

    return NextResponse.json({
      optimizedResumeUrl: blob.url,
      filename,
      score: newScoreResult,
    })
    
  } catch (error) {
    console.error('[API optimize] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
