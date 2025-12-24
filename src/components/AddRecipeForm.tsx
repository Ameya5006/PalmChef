import React, { useState } from 'react'
import { useRecipesStore } from '@/store/recipes'
import { parsePdfToSteps } from '@/utils/pdfParser'

const AddRecipeForm: React.FC = () => {
  const addRecipe = useRecipesStore((s) => s.addRecipe)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const steps = await parsePdfToSteps(file)
      addRecipe({ id: crypto.randomUUID(), title: file.name, steps })
    } catch (err) {
      console.error(err)
      setError('Failed to parse PDF.')
    } finally {
      setLoading(false)
    }
  }

  const handleUrlAdd = () => {
    if (!url.trim()) return
    addRecipe({ id: crypto.randomUUID(), title: url, steps: [`Visit ${url}`] })
    setUrl('')
  }

  return (
    <div className="border rounded-xl p-6 shadow-sm bg-slate-50 dark:bg-slate-800">
      <h2 className="text-lg font-semibold mb-3">Add a Recipe</h2>
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="text-sm">Upload PDF:</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFile}
            disabled={loading}
            className="mt-1 block w-full text-sm"
          />
        </label>
        <div className="flex items-center gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/recipe"
            className="flex-grow rounded-md border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
          />
          <button
            onClick={handleUrlAdd}
            className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600"
          >
            Add
          </button>
        </div>
        {loading && <p className="text-sky-500 text-sm">Parsing PDF...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  )
}

export default AddRecipeForm
