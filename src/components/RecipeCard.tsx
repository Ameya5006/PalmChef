// src/components/RecipeCard.tsx
import React from "react"

interface RecipeCardProps {
  title: string
  description?: string
  onClick?: () => void
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  title,
  description,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition cursor-pointer"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
          {description}
        </p>
      )}
    </div>
  )
}

export default RecipeCard
