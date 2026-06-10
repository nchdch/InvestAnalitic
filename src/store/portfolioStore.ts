import { create } from 'zustand'

const STORAGE_KEY = 'ia_selected_account_id'

function getSavedAccountId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

interface PortfolioStore {
  version: number
  bump: () => void
  selectedAccountId: string | null
  setSelectedAccountId: (id: string | null) => void
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
  selectedAccountId: getSavedAccountId(),
  setSelectedAccountId: (id) => set((s) => {
    const next = s.selectedAccountId === id ? null : id
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
    return { selectedAccountId: next }
  }),
}))
