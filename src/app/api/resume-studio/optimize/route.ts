import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTextFromResume, optimizeResumeText, scoreResume } from '@/lib/resume-ai'
import { generateATSDocx, generateFormattedDocx } from '@/lib/resume-docx'
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

    // Extract original resume text (supports both DOC and DOCX)
    const resumeText = await extractTextFromResume(record.candidate.resumeUrl)
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

    // Generate both versions
    const [atsBuffer, formattedBuffer] = await Promise.all([
      generateATSDocx(
        optimizedText, 
        record.candidate.fullName,
        record.jobTitle,
        record.company || ''
      ),
      generateFormattedDocx(
        optimizedText,
        record.candidate.fullName,
        record.jobTitle,
        record.company || ''
      ),
    ])

    // Generate base filename
    const cleanName = record.candidate.fullName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20)
    const cleanTitle = record.jobTitle
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20)
    const cleanCompany = (record.company || 'General')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 15)
    const date = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '')

    const docxType = 'application/vnd.openxmlformats-officedocument' +
      '.wordprocessingml.document'

    // Upload both versions
    const [atsBlob, formattedBlob] = await Promise.all([
      put(
        `optimized-resumes/ATS_${cleanName}_${cleanTitle}_${cleanCompany}_${date}.docx`,
        atsBuffer,
        { access: 'public', addRandomSuffix: true, contentType: docxType }
      ),
      put(
        `optimized-resumes/Formatted_${cleanName}_${cleanTitle}_${cleanCompany}_${date}.docx`,
        formattedBuffer,
        { access: 'public', addRandomSuffix: true, contentType: docxType }
      ),
    ])

    console.log('[Optimize] ATS version:', atsBlob.url)
    console.log('[Optimize] Formatted version:', formattedBlob.url)

    // Re-score the optimized resume to get updated score
    const newScoreResult = await scoreResume(
      optimizedText,
      record.jobTitle,
      record.jobDescription,
      record.company || undefined
    )

    console.log('[API optimize] Re-scored optimized resume:', newScoreResult.overall)

    // Update the database with the optimized result
    const updated = await prisma.optimizedResume.update({
      where: { id: optimizedResumeId },
      data: {
        optimizedResumeUrl: atsBlob.url,    // primary URL = ATS version
        // TODO: Uncomment after running migration: npx prisma migrate dev --name add_dual_resume_urls
        // atsResumeUrl: atsBlob.url,
        // formattedResumeUrl: formattedBlob.url,
        compatibilityScore: newScoreResult.overall,
        scoreBreakdown: newScoreResult.breakdown,
        status: 'OPTIMIZED',
      }
    })

    console.log('[API optimize] Updated database record')

    return NextResponse.json({
      id: updated.id,
      optimizedResumeUrl: atsBlob.url,
      atsResumeUrl: atsBlob.url,
      formattedResumeUrl: formattedBlob.url,
      atsFilename: atsBlob.pathname,
      formattedFilename: formattedBlob.pathname,
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
