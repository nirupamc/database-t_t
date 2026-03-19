import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

/**
 * Generate a DOCX file from optimized resume text
 */
export async function generateOptimizedResumeDocx(
  optimizedText: string,
  candidateName: string,
  jobTitle: string,
  company?: string
): Promise<Buffer> {
  console.log('[generateOptimizedResumeDocx] Generating DOCX for:', candidateName)
  
  try {
    // Parse the optimized text into sections
    const sections = parseResumeText(optimizedText)
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header with candidate name
          new Paragraph({
            text: candidateName,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          
          // Optimized for job note (small watermark)
          new Paragraph({
            children: [
              new TextRun({
                text: `Optimized for: ${jobTitle}${company ? ` at ${company}` : ''}`,
                italics: true,
                size: 18,
                color: "666666",
              }),
            ],
            spacing: { after: 400 },
          }),
          
          // Content sections
          ...generateDocumentSections(sections),
        ],
      }],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)
    
    console.log('[generateOptimizedResumeDocx] DOCX generated, size:', buffer.length)
    return buffer
    
  } catch (error) {
    console.error('[generateOptimizedResumeDocx] Error:', error)
    throw new Error('Failed to generate optimized resume DOCX')
  }
}

/**
 * Parse resume text into structured sections
 */
function parseResumeText(text: string): Array<{ title: string; content: string[] }> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const sections: Array<{ title: string; content: string[] }> = []
  let currentSection: { title: string; content: string[] } | null = null
  
  for (const line of lines) {
    // Check if line is a section header (contains common resume section keywords)
    const isHeader = /^(summary|objective|experience|education|skills|certifications|projects|achievements|contact)/i.test(line) ||
                     line.toUpperCase() === line && line.length < 50
    
    if (isHeader) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection)
      }
      // Start new section
      currentSection = { title: line, content: [] }
    } else if (currentSection) {
      // Add content to current section
      currentSection.content.push(line)
    } else {
      // First content before any header
      if (!sections.length) {
        sections.push({ title: 'Summary', content: [line] })
      } else {
        sections[sections.length - 1].content.push(line)
      }
    }
  }
  
  // Save final section
  if (currentSection) {
    sections.push(currentSection)
  }
  
  return sections
}

/**
 * Generate document sections from parsed content
 */
function generateDocumentSections(sections: Array<{ title: string; content: string[] }>): Paragraph[] {
  const paragraphs: Paragraph[] = []
  
  for (const section of sections) {
    // Section heading
    paragraphs.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    )
    
    // Section content
    for (const contentLine of section.content) {
      // Check if it's a bullet point
      const isBullet = contentLine.startsWith('•') || contentLine.startsWith('-') || contentLine.startsWith('*')
      
      if (isBullet) {
        // Bullet point
        paragraphs.push(
          new Paragraph({
            text: contentLine.replace(/^[•\-*]\s*/, ''),
            bullet: { level: 0 },
            spacing: { after: 100 },
          })
        )
      } else {
        // Regular paragraph
        paragraphs.push(
          new Paragraph({
            text: contentLine,
            spacing: { after: 150 },
          })
        )
      }
    }
  }
  
  return paragraphs
}

/**
 * Generate filename for optimized resume
 */
export function generateOptimizedResumeFilename(
  candidateName: string,
  jobTitle: string,
  company?: string
): string {
  const cleanName = candidateName.replace(/[^a-zA-Z0-9]/g, '_')
  const cleanJobTitle = jobTitle.replace(/[^a-zA-Z0-9]/g, '_')
  const cleanCompany = company ? company.replace(/[^a-zA-Z0-9]/g, '_') : ''
  
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  if (cleanCompany) {
    return `${cleanName}_${cleanJobTitle}_${cleanCompany}_${date}.docx`
  } else {
    return `${cleanName}_${cleanJobTitle}_${date}.docx`
  }
}