import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
  ShadingType,
  TableRow,
  TableCell,
  Table,
  WidthType,
  UnderlineType,
} from 'docx'

// ── Helper: detect line type ──
function detectLineType(line: string): 
  'name' | 'contact' | 'section' | 'bullet' | 'job_header' | 
  'date' | 'empty' | 'normal' {
  const t = line.trim()
  if (!t) return 'empty'
  
  // Contact info line (has email or phone)
  if (t.includes('@') || t.match(/\+?\d[\d\s\-\(\)]{8,}/)) 
    return 'contact'
  
  // Section headers (all caps, short, no special chars)
  if (
    t === t.toUpperCase() && 
    t.length > 2 && 
    t.length < 60 &&
    !t.includes('@') &&
    /^[A-Z\s\/\-&]+$/.test(t)
  ) return 'section'
  
  // Bullet points
  if (t.startsWith('•') || t.startsWith('-') || 
      t.startsWith('*') || t.startsWith('–'))
    return 'bullet'
  
  // Job header (contains | or has Company pattern)
  if (t.includes(' | ') && t.length < 150) 
    return 'job_header'
  
  // Date ranges
  if (t.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d|19\d\d)\b/) 
      && t.length < 60)
    return 'date'
  
  return 'normal'
}

// ── VERSION 1: ATS-Friendly Clean Format ──
export async function generateATSDocx(
  text: string,
  candidateName: string,
  jobTitle: string,
  company: string
): Promise<Buffer> {
  console.log('[DocxGenerator] Generating ATS version for:', candidateName)

  const lines = text.split('\n')
  const children: Paragraph[] = []

  // Add ATS header comment
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Optimized for: ${jobTitle}${company ? ` at ${company}` : ''}`,
          italics: true,
          color: '666666',
          size: 18,
        })
      ],
      spacing: { after: 200 },
    })
  )

  let isFirstLine = true

  for (const line of lines) {
    const trimmed = line.trim()
    const type = detectLineType(trimmed)

    if (type === 'empty') {
      children.push(new Paragraph({ 
        spacing: { after: 80 } 
      }))
      continue
    }

    // First non-empty line = candidate name
    if (isFirstLine && trimmed) {
      // Extract real name — remove markdown if present
      const cleanName = trimmed
        .replace(/^#+\s*/, '')
        .replace(/\*/g, '')
        .trim()
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanName,
              bold: true,
              size: 36,
              color: '1a1a1a',
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      )
      isFirstLine = false
      continue
    }

    switch (type) {
      case 'contact':
        children.push(
          new Paragraph({
            children: [new TextRun({ 
              text: trimmed, 
              size: 18, 
              color: '444444' 
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          })
        )
        break

      case 'section':
        // Add spacing before section
        children.push(new Paragraph({ spacing: { before: 200 } }))
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 24,
                color: '1a1a1a',
                allCaps: true,
              })
            ],
            border: {
              bottom: {
                color: 'cccccc',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              }
            },
            spacing: { after: 120 },
          })
        )
        break

      case 'job_header':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 22,
              })
            ],
            spacing: { before: 160, after: 80 },
          })
        )
        break

      case 'date':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                italics: true,
                size: 18,
                color: '666666',
              })
            ],
            spacing: { after: 80 },
          })
        )
        break

      case 'bullet':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed.replace(/^[•\-\*–]\s*/, ''),
                size: 20,
              })
            ],
            bullet: { level: 0 },
            spacing: { after: 60 },
            indent: { left: 360 },
          })
        )
        break

      default:
        // Check if it looks like a paragraph that should 
        // be split into bullets
        if (trimmed.length > 150) {
          // Long paragraph — keep as paragraph
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, size: 20 })],
              spacing: { after: 80 },
            })
          )
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, size: 20 })],
              spacing: { after: 80 },
            })
          )
        }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
          },
          paragraph: {
            spacing: { line: 276 },
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720,
          }
        }
      },
      children,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  console.log('[DocxGenerator] ATS DOCX generated, size:', buffer.length)
  return buffer
}

// ── VERSION 2: Formatted Version ──
// Preserves structure, injects optimized content
export async function generateFormattedDocx(
  optimizedText: string,
  candidateName: string,
  jobTitle: string,
  company: string
): Promise<Buffer> {
  console.log('[DocxGenerator] Generating formatted version for:', candidateName)

  const lines = optimizedText.split('\n')
  const children: Paragraph[] = []

  // ── Header Banner ──
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: candidateName.toUpperCase(),
          bold: true,
          size: 40,
          color: '1a1a1a',
          font: 'Calibri',
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    })
  )

  // Optimized label
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Optimized for: ${jobTitle}${company ? ` at ${company}` : ''}`,
          italics: true,
          size: 18,
          color: '888888',
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  )

  let skipName = true // skip first name line since we added it above
  let inSkillsSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip empty lines at start
    if (skipName && !trimmed) continue
    
    // Skip the first name line (already added above)
    if (skipName && trimmed) {
      const cleanLine = trimmed.replace(/^#+\s*/, '').replace(/\*/g, '').trim()
      if (
        cleanLine.toLowerCase() === candidateName.toLowerCase() ||
        cleanLine.toLowerCase().includes(candidateName.toLowerCase().split(' ')[0])
      ) {
        skipName = false
        continue
      }
      skipName = false
    }

    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 60 } }))
      continue
    }

    const type = detectLineType(trimmed)

    // Track if we're in skills section
    if (type === 'section' && trimmed.toLowerCase().includes('skill')) {
      inSkillsSection = true
    } else if (type === 'section') {
      inSkillsSection = false
    }

    switch (type) {
      case 'contact':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                size: 19,
                color: '444444',
                font: 'Calibri',
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          })
        )
        break

      case 'section':
        children.push(new Paragraph({ 
          spacing: { before: 240, after: 0 } 
        }))
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 24,
                color: '1F3864',
                allCaps: true,
                font: 'Calibri',
              })
            ],
            border: {
              bottom: {
                color: '1F3864',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 8,
              }
            },
            spacing: { after: 120 },
          })
        )
        break

      case 'job_header':
        // Split by | for role | company | location format
        const parts = trimmed.split(' | ')
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: parts[0] || trimmed,
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
              ...(parts[1] ? [new TextRun({
                text: ` | ${parts.slice(1).join(' | ')}`,
                size: 22,
                color: '555555',
                font: 'Calibri',
              })] : [])
            ],
            spacing: { before: 160, after: 60 },
          })
        )
        break

      case 'date':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                italics: true,
                size: 19,
                color: '666666',
                font: 'Calibri',
              })
            ],
            spacing: { after: 100 },
          })
        )
        break

      case 'bullet':
        const bulletText = trimmed.replace(/^[•\-\*–]\s*/, '')
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: bulletText,
                size: 20,
                font: 'Calibri',
              })
            ],
            bullet: { level: 0 },
            spacing: { after: 60 },
            indent: { left: 360, hanging: 360 },
          })
        )
        break

      default:
        // Check for colon-separated skill lines
        // e.g. "Cloud Platforms: AWS, Azure, GCP"
        if (trimmed.includes(':') && inSkillsSection) {
          const colonIdx = trimmed.indexOf(':')
          const skillLabel = trimmed.substring(0, colonIdx)
          const skillValue = trimmed.substring(colonIdx + 1).trim()
          
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: skillLabel + ': ',
                  bold: true,
                  size: 20,
                  font: 'Calibri',
                }),
                new TextRun({
                  text: skillValue,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 80 },
            })
          )
        } else {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmed,
                  size: 20,
                  font: 'Calibri',
                })
              ],
              spacing: { after: 80 },
            })
          )
        }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
          },
          paragraph: {
            spacing: { line: 276 },
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720,
          }
        }
      },
      children,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  console.log('[DocxGenerator] Formatted DOCX generated, size:', buffer.length)
  return buffer
}

// ── Keep old function for backwards compatibility ──
export async function generateDocxFromText(
  text: string,
  candidateName: string
): Promise<Buffer> {
  return generateATSDocx(text, candidateName, '', '')
}

// ── Keep old function for backwards compatibility ──
export async function generateOptimizedResumeDocx(
  optimizedText: string,
  candidateName: string,
  jobTitle: string,
  company?: string
): Promise<Buffer> {
  return generateFormattedDocx(optimizedText, candidateName, jobTitle, company || '')
}