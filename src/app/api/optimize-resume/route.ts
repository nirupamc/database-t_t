import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromDocx, optimizeResume, scoreResume } from '@/lib/resume-ai'
import { generateDocxFromText } from '@/lib/resume-docx'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  console.log('[ResumeStudio/Optimize] Route hit')
  
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { optimizedResumeId } = await request.json()

    if (!optimizedResumeId) {
      return NextResponse.json(
        { error: 'optimizedResumeId is required' },
        { status: 400 }
      )
    }

    // Get the scored resume record
    const record = await prisma.optimizedResume.findUnique({
      where: { id: optimizedResumeId },
      include: { candidate: true }
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }

    // Extract original resume text
    const resumeText = await extractTextFromDocx(record.originalResumeUrl)

    // Optimize with AI
    const optimizedText = await optimizeResume(resumeText, record.jobDescription)

    // Generate DOCX from optimized text
    const docxBuffer = await generateDocxFromText(
      optimizedText,
      record.candidate.fullName
    )

    // Generate filename using naming convention:
    // CandidateName_JobTitle_Company_Date.docx
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
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '')

    const atsFilename = `optimized-resumes/ATS_${cleanName}_${cleanTitle}_${cleanCompany}_${date}.docx`
    const formattedFilename = `optimized-resumes/Formatted_${cleanName}_${cleanTitle}_${cleanCompany}_${date}.docx`

    // Upload ATS + Formatted links (same DOCX content for now)
    const [atsBlob, formattedBlob] = await Promise.all([
      put(atsFilename, docxBuffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      put(formattedFilename, docxBuffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    ])

    // Score the optimized resume
    const newScore = await scoreResume(optimizedText, record.jobDescription)

    // Update DB record
    const updated = await prisma.optimizedResume.update({
      where: { id: optimizedResumeId },
      data: {
        optimizedResumeUrl: atsBlob.url,
        atsResumeUrl: atsBlob.url,
        formattedResumeUrl: formattedBlob.url,
        compatibilityScore: newScore.overall,
        scoreBreakdown: newScore as object,
        status: 'OPTIMIZED',
      }
    })

    console.log('[ResumeStudio/Optimize] Done ATS:', atsBlob.url)
    console.log('[ResumeStudio/Optimize] Done Formatted:', formattedBlob.url)

    return NextResponse.json({
      id: updated.id,
      optimizedResumeUrl: atsBlob.url,
      atsResumeUrl: atsBlob.url,
      formattedResumeUrl: formattedBlob.url,
      score: newScore,
      atsFilename,
      formattedFilename,
    })

  } catch (error) {
    console.error('[ResumeStudio/Optimize] Error:', error)
    return NextResponse.json(
      { error: 'Optimization failed. Please try again.' },
      { status: 500 }
    )
  }
}
