
import * as pdfjsLib from "pdfjs-dist";

// ✅ Vite-safe, pdfjs v5-compatible worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  let text = ""

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((i: any) => i.str).join(" ") + "\n\n"
  }

  return text.trim()
}

export function splitIntoSteps(raw: string): string[] {
  const cleaned = raw
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  const parts = cleaned
    .split(/\n\s*\n/g)
    .map(s => s.trim())
    .filter(Boolean)

  if (parts.length < 3) {
    return cleaned
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
      .map(s => s.trim())
      .filter(s => s.length > 12)
  }

  return parts
}

export function parseDurationToSeconds(text: string): number | null {
  const t = text.toLowerCase()
  const re =
    /(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\b/g

  let total = 0
  let found = false

  for (const m of t.matchAll(re)) {
    found = true
    const n = Number(m[1])
    const u = m[2]
    if (["h", "hr", "hrs", "hour", "hours"].includes(u)) total += n * 3600
    else if (["m", "min", "mins", "minute", "minutes"].includes(u)) total += n * 60
    else total += n
  }

  if (found && total > 0) return total
  if (/\bovernight\b/.test(t)) return 8 * 3600
  return null
}
