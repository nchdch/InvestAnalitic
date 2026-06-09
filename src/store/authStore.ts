import { create } from 'zustand'
import type { AuthUser } from '@/types'

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: AuthUser, token: string) => void
  setToken: (token: string) => void
  clearAuth: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  setAuth: (user, accessToken) => set({ user, accessToken, isLoading: false }),
  setToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ user: null, accessToken: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
