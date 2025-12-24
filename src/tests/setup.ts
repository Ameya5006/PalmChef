import '@testing-library/jest-dom'

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
  },
  configurable: true
})

// Mock speechSynthesis
Object.defineProperty(global, 'speechSynthesis', {
  value: {
    speaking: false,
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn().mockReturnValue([
      { name: 'Test Voice', lang: 'en-US' }
    ])
  },
  configurable: true
})

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb: FrameRequestCallback): number => {
  return setTimeout(() => cb(performance.now()), 16) as unknown as number
}
global.cancelAnimationFrame = (id: number) => clearTimeout(id)

// Minimal canvas mock (for PDFViewer just in case)
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  drawImage: vi.fn(),
  clearRect: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn()
})

// Mock @mediapipe/hands
vi.mock('@mediapipe/hands', async () => {
  class Hands {
    setOptions = vi.fn()
    onResults = vi.fn()
    send = vi.fn()
    close = vi.fn()
    constructor(_: any) {}
  }
  return {
    Hands,
  }
})

// Mock pdfjs-dist getDocument for tests that import it
vi.mock('pdfjs-dist', async () => {
  return {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: '1) Preheat oven to 180C.' }, { str: '2) Bake for 15 minutes.' }]
          })
        })
      })
    })
  }
})
