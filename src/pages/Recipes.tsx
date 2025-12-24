import React from 'react'
import AddRecipeForm from '@/components/AddRecipeForm'
import RecipeCard from '@/components/RecipeCard'
import { useRecipesStore } from '@/store/recipes'

const Recipes: React.FC = () => {
  const recipes = useRecipesStore((s) => s.recipes)

  return (
    <div className="space-y-6">
      <AddRecipeForm />
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-slate-500">No recipes added yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Recipes
