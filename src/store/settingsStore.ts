import { create } from 'zustand'

const STORAGE_KEY = 'ia_assistant_settings'

interface PersistedSettings {
  rebalanceThreshold: number
  concentrationThreshold: number
  sectorConcentrationThreshold: number
}

const DEFAULTS: PersistedSettings = {
  rebalanceThreshold: 5,
  concentrationThreshold: 25,
  sectorConcentrationThreshold: 70,
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return {
      rebalanceThreshold: typeof parsed.rebalanceThreshold === 'number' ? parsed.rebalanceThreshold : DEFAULTS.rebalanceThreshold,
      concentrationThreshold: typeof parsed.concentrationThreshold === 'number' ? parsed.concentrationThreshold : DEFAULTS.concentrationThreshold,
      sectorConcentrationThreshold: typeof parsed.sectorConcentrationThreshold === 'number' ? parsed.sectorConcentrationThreshold : DEFAULTS.sectorConcentrationThreshold,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveSettings(settings: PersistedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // localStorage недоступен — настройки не сохранятся между сессиями
  }
}

interface SettingsStore extends PersistedSettings {
  setRebalanceThreshold: (value: number) => void
  setConcentrationThreshold: (value: number) => void
  setSectorConcentrationThreshold: (value: number) => void
}

function persist(state: SettingsStore) {
  saveSettings({
    rebalanceThreshold: state.rebalanceThreshold,
    concentrationThreshold: state.concentrationThreshold,
    sectorConcentrationThreshold: state.sectorConcentrationThreshold,
  })
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadSettings(),
  setRebalanceThreshold: (value) => {
    set({ rebalanceThreshold: value })
    persist(get())
  },
  setConcentrationThreshold: (value) => {
    set({ concentrationThreshold: value })
    persist(get())
  },
  setSectorConcentrationThreshold: (value) => {
    set({ sectorConcentrationThreshold: value })
    persist(get())
  },
}))
