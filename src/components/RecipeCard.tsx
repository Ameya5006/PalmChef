import React, { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

interface RecipeCardProps {
  title: string
  stepsCount: number
  imageSrc: string
  onClick?: () => void
  onRename?: (title: string) => void
  onDelete?: () => void
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  title,
  stepsCount,
  imageSrc,
  onClick,
  onRename,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(title)
    }
  }, [title, isEditing])

  const handleSave = () => {
    const trimmed = draftTitle.trim()
    if (!trimmed) {
      setDraftTitle(title)
      setIsEditing(false)
      return
    }
    if (trimmed !== title) {
      onRename?.(trimmed)
    }
    setIsEditing(false)
  }

  return (
    <div
      onClick={onClick}
      className="group relative flex min-h-[140px] gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <img
          src={imageSrc}
          alt=""
          className="h-10 w-10 object-contain"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onBlur={handleSave}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleSave()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                setDraftTitle(title)
                setIsEditing(false)
              }
            }}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            autoFocus
          />
        ) : (
          <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
        )}
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          {stepsCount} steps
        </p>
      
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setIsEditing(true)
          }}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
          aria-label="Rename recipe"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete?.()
          }}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400"
          aria-label="Delete recipe"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default RecipeCard