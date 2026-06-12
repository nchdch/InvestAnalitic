import { create } from 'zustand'

const STORAGE_KEY = 'ia_rebalance_targets'

function loadTargets(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const result: Record<string, number> = {}
    for (const [ticker, weight] of Object.entries(parsed)) {
      if (typeof weight === 'number' && Number.isFinite(weight)) result[ticker] = weight
    }
    return result
  } catch {
    return {}
  }
}

function saveTargets(targets: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
  } catch {
    // localStorage недоступен — целевые веса не сохранятся между сессиями
  }
}

interface RebalanceStore {
  /** Целевые веса по тикеру, % от стоимости портфеля. Тикеры без записи используют текущий вес как цель. */
  targets: Record<string, number>
  setTarget: (ticker: string, weight: number) => void
  removeTarget: (ticker: string) => void
  resetTargets: () => void
}

export const useRebalanceStore = create<RebalanceStore>((set, get) => ({
  targets: loadTargets(),
  setTarget: (ticker, weight) => {
    const targets = { ...get().targets, [ticker]: weight }
    set({ targets })
    saveTargets(targets)
  },
  removeTarget: (ticker) => {
    const targets = { ...get().targets }
    delete targets[ticker]
    set({ targets })
    saveTargets(targets)
  },
  resetTargets: () => {
    set({ targets: {} })
    saveTargets({})
  },
}))
