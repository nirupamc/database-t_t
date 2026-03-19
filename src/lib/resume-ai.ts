import OpenAI from 'openai'
import mammoth from 'mammoth'

// Initialize OpenAI client with NVIDIA API
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

/**
 * Extract text content from a DOCX file
 */
export async function extractTextFromDocx(url: string): Promise<string> {
  console.log('[extractTextFromDocx] Processing URL:', url)
  
  try {
    // Fetch the DOCX file
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Extract text using mammoth
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()
    
    console.log('[extractTextFromDocx] Extracted text length:', text.length)
    
    if (!text || text.length < 50) {
      throw new Error('Extracted text is too short or empty')
    }
    
    return text
    
  } catch (error) {
    console.error('[extractTextFromDocx] Error:', error)
    throw new Error('Failed to extract text from resume file')
  }
}

/**
 * Score a resume against a job description using AI
 */
export async function scoreResume(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  company?: string
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
  console.log('[scoreResume] Starting analysis for:', jobTitle, company || 'Unknown Company')
  
  try {
    const prompt = `You are an expert ATS (Applicant Tracking System) that analyzes resume compatibility.

TASK: Score this resume against the job requirements and provide detailed feedback.

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${company || 'Not specified'}
- Description: ${jobDescription}

RESUME TEXT:
${resumeText}

INSTRUCTIONS:
1. Analyze the resume against the job requirements
2. Score each category from 1-10
3. Identify matched and missing keywords/skills
4. Provide improvement suggestions

Respond with VALID JSON in this exact format:
{
  "overall": 7,
  "breakdown": {
    "keywords": {
      "score": 6,
      "matched": ["JavaScript", "React", "Node.js"],
      "missing": ["TypeScript", "AWS", "Docker"]
    },
    "skills": {
      "score": 7,
      "matched": ["Frontend Development", "API Integration"],
      "missing": ["DevOps", "Testing"]
    },
    "experience": {
      "score": 8,
      "notes": "Strong experience in relevant technologies with good project examples"
    },
    "education": {
      "score": 6,
      "notes": "Computer Science degree is relevant but could benefit from additional certifications"
    }
  },
  "fitIndicator": "GOOD_FIT",
  "suggestions": [
    "Add TypeScript to skills section",
    "Include cloud platform experience",
    "Highlight testing methodologies"
  ]
}

Score ranges:
- 9-10: STRONG_FIT
- 7-8: GOOD_FIT  
- 5-6: PARTIAL_FIT
- 1-4: NOT_A_FIT`

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI model')
    }

    console.log('[scoreResume] AI Response length:', response.length)

    // Parse JSON response
    let scoreResult
    try {
      // Clean response - remove markdown code fences
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      // Extract JSON object - find the first { and last } to handle extra text
      const firstBrace = cleanResponse.indexOf('{')
      const lastBrace = cleanResponse.lastIndexOf('}')
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        console.error('[scoreResume] No valid JSON object found in response')
        throw new Error('No JSON object found in AI response')
      }
      
      const jsonOnly = cleanResponse.substring(firstBrace, lastBrace + 1)
      console.log('[scoreResume] Extracted JSON length:', jsonOnly.length)
      
      scoreResult = JSON.parse(jsonOnly)
    } catch (parseError) {
      console.error('[scoreResume] JSON parse error:', parseError)
      console.error('[scoreResume] Raw response:', response.substring(0, 500))
      throw new Error('Invalid response format from AI model')
    }

    // Validate response structure
    if (!scoreResult.overall || !scoreResult.breakdown || !scoreResult.fitIndicator) {
      throw new Error('Incomplete response from AI model')
    }

    console.log('[scoreResume] Analysis complete, overall score:', scoreResult.overall)
    return scoreResult

  } catch (error) {
    console.error('[scoreResume] Error:', error)
    throw error
  }
}

/**
 * Optimize resume text using AI recommendations
 */
export async function optimizeResumeText(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  scoreBreakdown: any,
  company?: string
): Promise<string> {
  console.log('[optimizeResumeText] Starting optimization for:', jobTitle)
  
  try {
    const missingKeywords = scoreBreakdown.keywords?.missing || []
    const missingSkills = scoreBreakdown.skills?.missing || []
    const suggestions = scoreBreakdown.suggestions || []

    const prompt = `You are an expert resume writer. Optimize this resume to achieve a 10/10 match for the target job.

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${company || 'Not specified'}
- Description: ${jobDescription}

CURRENT RESUME:
${resumeText}

IDENTIFIED GAPS:
- Missing Keywords: ${missingKeywords.join(', ')}
- Missing Skills: ${missingSkills.join(', ')}
- Suggestions: ${suggestions.join('; ')}

OPTIMIZATION GOALS:
1. Integrate missing keywords naturally
2. Enhance skill descriptions
3. Improve experience relevance
4. Optimize for ATS scanning
5. Maintain authentic content

INSTRUCTIONS:
- Keep the same overall structure and format
- Preserve all factual information (dates, companies, education)
- Add missing keywords in context-appropriate places
- Enhance existing bullet points rather than adding fake experience
- Focus on relevant achievements and skills
- Make the resume ATS-friendly

RESPOND WITH ONLY THE OPTIMIZED RESUME TEXT - NO JSON, NO MARKDOWN, NO EXPLANATIONS.
Just return the complete optimized resume as plain text.`

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message?.content || ''
    
    console.log('[optimizeResumeText] Response length:', content.length)
    
    if (!content || content.trim().length < 100) {
      throw new Error('AI returned empty or too short response')
    }
    
    // Clean up any markdown formatting if present
    const cleaned = content
      .replace(/^```[\w]*\n?/gm, '')  // remove code block starts
      .replace(/^```$/gm, '')          // remove code block ends
      .trim()
    
    console.log('[optimizeResumeText] Success, returning text length:', cleaned.length)
    return cleaned

  } catch (error) {
    console.error('[optimizeResumeText] Error:', error)
    throw error
  }
}