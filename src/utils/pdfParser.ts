import * as pdfjsLib from 'pdfjs-dist'
// ✅ Import the actual worker as a URL so Vite bundles it
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

// ✅ Tell PDF.js to use this local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

async function extractTextFromPage(page: any): Promise<string> {
  const content = await page.getTextContent()
  const strings = content.items.map((item: any) => item.str)
  return strings.join(' ')
}

export async function parsePdfToSteps(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      text += '\n' + (await extractTextFromPage(page))
    }

    // Split into recipe-like steps
    const steps = text
      .split(/\n|\r|\d+\.\s+|Step\s+\d+:/gi)
      .map(s => s.trim())
      .filter(Boolean)

    if (steps.length === 0) throw new Error('No text found in PDF.')
    return steps
  } catch (err) {
    console.error('Failed to parse PDF:', err)
    throw new Error('Failed to parse PDF. Please ensure it contains selectable text.')
  }
}
