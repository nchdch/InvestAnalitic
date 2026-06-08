import { create } from 'zustand'
import type { Account, Position, Trade } from '@/types'

/**
 * Каркас стейта портфеля. Заполняется по мере реализации функций учёта —
 * сейчас содержит только структуру, согласованную с src/types.
 */
interface PortfolioState {
  accounts: Account[]
  positions: Position[]
  trades: Trade[]
  setAccounts: (accounts: Account[]) => void
  setPositions: (positions: Position[]) => void
  setTrades: (trades: Trade[]) => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  accounts: [],
  positions: [],
  trades: [],
  setAccounts: (accounts) => set({ accounts }),
  setPositions: (positions) => set({ positions }),
  setTrades: (trades) => set({ trades }),
}))
