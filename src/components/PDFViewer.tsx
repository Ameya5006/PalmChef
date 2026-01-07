import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.js'

interface Props {
  file?: File
  url?: string
}

const PDFViewer: React.FC<Props> = ({ file, url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(1)

  useEffect(() => {
    let canceled = false
    const load = async () => {
      try {
        const data = file ? { data: await file.arrayBuffer() } : { url }
        const pdf = await pdfjsLib.getDocument(data).promise
        if (canceled) return
        setNumPages(pdf.numPages)
        const p = await pdf.getPage(page)
        const viewport = p.getViewport({ scale: 1.3 })
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width
        await p.render({ canvasContext: ctx, viewport, canvas }).promise
            } catch (e) {
        console.warn('PDF render failed', e)
      }
    }
    load()
    return () => {
      canceled = true
    }
  }, [file, url, page])

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page}/{numPages}
        </div>
        <button
          disabled={page >= numPages}
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-lg border border-slate-200 dark:border-slate-700" />
    </div>
  )
}

export default PDFViewer
