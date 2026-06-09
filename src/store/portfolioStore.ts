import { create } from 'zustand'

interface PortfolioStore {
  version: number
  bump: () => void
  selectedAccountId: string | null
  setSelectedAccountId: (id: string | null) => void
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
  selectedAccountId: null,
  setSelectedAccountId: (id) => set((s) => ({ selectedAccountId: s.selectedAccountId === id ? null : id })),
}))
