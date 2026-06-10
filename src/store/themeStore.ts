import { create } from 'zustand'

const STORAGE_KEY = 'ia_theme'

export type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getSavedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: getSavedTheme() ?? getSystemTheme(),
  setTheme: (theme) => {
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))

// Пока пользователь не выбрал тему вручную — следуем за системной темой
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (getSavedTheme()) return
    const theme: Theme = e.matches ? 'dark' : 'light'
    applyTheme(theme)
    useThemeStore.setState({ theme })
  })
}
