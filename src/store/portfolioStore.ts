import { create } from 'zustand'

interface PortfolioStore {
  version: number
  bump: () => void
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}))
