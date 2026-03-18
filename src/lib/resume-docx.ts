import { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel,
  AlignmentType,
  Packer 
} from 'docx'

export async function generateDocxFromText(
  text: string,
  candidateName: string
): Promise<Buffer> {
  console.log('[DocxGenerator] Generating DOCX for:', candidateName)

  const lines = text.split('\n').filter(line => line.trim())
  
  const children = lines.map(line => {
    const trimmed = line.trim()
    
    // Detect section headers (all caps or ending with :)
    if (
      trimmed === trimmed.toUpperCase() && 
      trimmed.length > 2 && 
      trimmed.length < 50
    ) {
      return new Paragraph({
        text: trimmed,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    }
    
    // Detect bullet points
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      return new Paragraph({
        text: trimmed.replace(/^[•\-\*]\s*/, ''),
        bullet: { level: 0 },
        spacing: { after: 60 },
      })
    }
    
    // Regular paragraph
    return new Paragraph({
      children: [new TextRun({ text: trimmed })],
      spacing: { after: 80 },
    })
  })

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  console.log('[DocxGenerator] DOCX generated, size:', buffer.length)
  return buffer
}