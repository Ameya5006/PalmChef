import React from 'react'
import { useNavigate } from 'react-router-dom'
import AddRecipeForm from '@/components/AddRecipeForm'
import RecipeCard from '@/components/RecipeCard'
import { useRecipesStore } from '@/store/recipes'
import { useSessionStore } from '@/store/session'
import logoImage from '@/assets/logo.png'
import hatImage from '@/assets/hat.png'

const Recipes: React.FC = () => {
  const hatImage = '/hat.png'
  const recipes = useRecipesStore(s => s.recipes)
  const removeRecipe = useRecipesStore(s => s.removeRecipe)
  const updateRecipe = useRecipesStore(s => s.updateRecipe)
  const setRecipe = useSessionStore(s => s.setRecipe)
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Recipe Library
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Build your hands-free cooking lineup.
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Import a recipe, let PalmChef detect steps and timers, then launch
              the assistant to cook without touching your screen.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-6 py-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
            <p className="font-semibold text-slate-900 dark:text-white">
              Library snapshot
            </p>
            <p className="mt-2">Recipes stored: {recipes.length}</p>
            <p>Total steps: {recipes.reduce((sum, recipe) => sum + recipe.steps.length, 0)}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <AddRecipeForm />
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <img
                src={hatImage}
                alt="Chef hat"
                className="h-10 w-10 rounded-full bg-slate-100 p-1 dark:bg-slate-800"
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Default preview style
                </p>
                <p className="mt-1 text-slate-500 dark:text-slate-300">
                  Each recipe card starts with the PalmChef logo and a clean
                  step count.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Quick start tips</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>Upload a PDF or paste a recipe link to auto-parse steps.</li>
            <li>Use ✋ to advance, ✊ to go back, and ✌️ to repeat a step.</li>
            <li>☝️ pauses or resumes narration when needed.</li>
          </ul>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
            <p className="font-semibold text-slate-900 dark:text-white">Pro tip</p>
            <p className="mt-2">
              Keep your device at counter height for the best gesture accuracy.
            </p>
          </div>
        </aside>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Recipes</h2>
          <p className="text-sm text-slate-500">
            Launch the assistant to start a guided session.
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              No recipes yet
            </p>
            <p className="mt-2">
              Add your first recipe above to unlock hands-free cooking.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.map(r => (
              <RecipeCard
                key={r.id}
                title={r.title}
                stepsCount={r.steps.length}
                imageSrc={hatImage}
                onRename={(title) => updateRecipe(r.id, { title })}
                onDelete={() => removeRecipe(r.id)}
                onClick={() => {
                  setRecipe(r.id)
                  navigate(`/assistant/${r.id}`)
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Recipes