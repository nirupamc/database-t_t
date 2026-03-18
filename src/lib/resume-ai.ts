import OpenAI from 'openai'
import mammoth from 'mammoth'

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
})

const MODEL = 'meta/llama-3.3-70b-instruct'

// ── Extract text from DOCX URL ──
export async function extractTextFromDocx(url: string): Promise<string> {
  console.log('[ResumeAI] Fetching DOCX from:', url)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch resume: ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const result = await mammoth.extractRawText({ buffer })
  
  console.log('[ResumeAI] Extracted text length:', result.value.length)
  return result.value
}

// ── Score resume against job description ──
export async function scoreResume(
  resumeText: string,
  jobDescription: string
): Promise<{
  overall: number
  breakdown: {
    keywords: { score: number; matched: string[]; missing: string[] }
    skills: { score: number; matched: string[]; missing: string[] }
    experience: { score: number; notes: string }
    education: { score: number; notes: string }
  }
  fitIndicator: 'STRONG_FIT' | 'GOOD_FIT' | 'PARTIAL_FIT' | 'NOT_A_FIT'
  suggestions: string[]
}> {
  console.log('[ResumeAI] Scoring resume...')

  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.
  
Analyze this resume against the job description and provide a compatibility score.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "overall": <number 1-10>,
  "breakdown": {
    "keywords": {
      "score": <number 1-10>,
      "matched": [<list of matching keywords found in both>],
      "missing": [<list of important keywords from JD missing in resume>]
    },
    "skills": {
      "score": <number 1-10>,
      "matched": [<list of matching skills>],
      "missing": [<list of required skills not found>]
    },
    "experience": {
      "score": <number 1-10>,
      "notes": "<brief explanation>"
    },
    "education": {
      "score": <number 1-10>,
      "notes": "<brief explanation>"
    }
  },
  "fitIndicator": "<STRONG_FIT|GOOD_FIT|PARTIAL_FIT|NOT_A_FIT>",
  "suggestions": [<list of 3-5 specific improvement suggestions>]
}`

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 2048,
  })

  const content = completion.choices[0]?.message?.content || ''
  console.log('[ResumeAI] Score response received')

  try {
    const clean = content.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    throw new Error('Failed to parse AI scoring response')
  }
}

// ── Optimize resume for job description ──
export async function optimizeResume(
  resumeText: string,
  jobDescription: string
): Promise<string> {
  console.log('[ResumeAI] Optimizing resume...')

  const prompt = `You are an expert resume writer and ATS optimization specialist.

Rewrite the resume below to better match the job description.

STRICT RULES:
1. Keep ALL personal information exactly the same 
   (name, email, phone, LinkedIn, address)
2. Keep ALL education entries exactly the same 
   (institution, degree, dates)
3. Keep ALL job titles and company names exactly the same
4. Keep ALL employment dates exactly the same
5. ONLY rewrite: job descriptions, bullet points, 
   skills section, summary/objective section
6. Add relevant keywords from the job description naturally
7. Do NOT invent experience, certifications, or skills 
   the candidate does not have
8. Do NOT change the overall resume structure/sections
9. Make the language more relevant to the target role
10. Return ONLY the rewritten resume text, no explanations

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

REWRITTEN RESUME:`

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    top_p: 0.7,
    max_tokens: 4096,
  })

  const optimized = completion.choices[0]?.message?.content || ''
  console.log('[ResumeAI] Optimization complete')
  return optimized
}