import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/types'

interface UserState {
  user: UserProfile
  setUser: (user: UserProfile) => void
  updateName: (name: string) => void
  logout: () => void
}

const initialUser: UserProfile = {
  id: '',
  name: 'Guest',
  email: '',
  avatarUrl: '',
  isAuthenticated: false
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: initialUser,
      setUser: (user) =>
        set({
          user: {
            ...user,
            isAuthenticated: true
          }
        }),
      updateName: (name) =>
        set((state) => ({
          user: {
            ...state.user,
            name
          }
        })),
      logout: () => set({ user: initialUser })
    }),
    { name: 'palmchef-user' }
  )
)