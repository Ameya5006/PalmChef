import React from 'react'
import { useNavigate } from 'react-router-dom'
import AddRecipeForm from '@/components/AddRecipeForm'
import RecipeCard from '@/components/RecipeCard'
import { useRecipesStore } from '@/store/recipes'
import { useSessionStore } from '@/store/session'

const Recipes: React.FC = () => {
  const recipes = useRecipesStore(s => s.recipes)
  const setRecipe = useSessionStore(s => s.setRecipe)
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <AddRecipeForm />

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Recipes</h2>

        {recipes.length === 0 ? (
          <p className="text-slate-500">No recipes added yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map(r => (
              <RecipeCard
                key={r.id}
                title={r.title}
                description={`${r.steps.length} steps`}
                onClick={() => {
                  setRecipe(r.id)
                  navigate(`/assistant/${r.id}`)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Recipes
