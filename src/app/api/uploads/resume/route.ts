import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('[Resume Upload] Route hit')

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const candidateName = 
      (formData.get('candidateName') as string) || 'Candidate'

    console.log('[Resume Upload] File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
    })

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      )
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument'
        + '.wordprocessingml.document',
      'application/pdf',
      'application/msword',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF or DOCX files are allowed' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()
    const cleanName = candidateName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30)
    const timestamp = Date.now()
    const filename = `resumes/Resume_${cleanName}_${timestamp}.${ext}`

    console.log('[Resume Upload] Uploading to Vercel Blob:', filename)

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log('[Resume Upload] ✅ Upload successful:', blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    })

  } catch (error) {
    console.error('[Resume Upload] Error:', error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
