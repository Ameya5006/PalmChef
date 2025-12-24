import { parsePdfToSteps } from '@/utils/pdfParser'

function mockFile(name: string, content: string, type = 'application/pdf'): File {
  const blob = new Blob([content], { type })
  // @ts-expect-error older TS lib
  blob.arrayBuffer = () => Promise.resolve(new TextEncoder().encode(content).buffer)
  return new File([blob], name, { type })
}

describe('pdfParser', () => {
  it('extracts steps from PDF text content', async () => {
    const file = mockFile('test.pdf', 'fake')
    const steps = await parsePdfToSteps(file)
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
    expect(steps[0]).toMatch(/Preheat|Bake/i)
  })
})
