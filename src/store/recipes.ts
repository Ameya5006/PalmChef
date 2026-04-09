import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Recipe } from '@/types'

interface RecipesState {
  recipes: Recipe[]
  addRecipe: (recipe: Recipe) => void
  removeRecipe: (id: string) => void
  updateRecipe: (id: string, data: Partial<Recipe>) => void
}

export const useRecipesStore = create<RecipesState>()(
  persist(
    (set) => ({
      recipes: [],
      addRecipe: (recipe) =>
        set((state) => ({ recipes: [...state.recipes, recipe] })),
      removeRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id)
        })),
      updateRecipe: (id, data) =>
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...data } : r
          )
        }))
    }),
    { name: 'palmchef-recipes' }
  )
)
