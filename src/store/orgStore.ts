import { create } from 'zustand'
import type { Organization } from '@/types'

const STORAGE_KEY = 'ia_active_org_id'

interface OrgStore {
  orgs: Organization[]
  activeOrg: Organization | null
  isLoading: boolean
  setOrgs: (orgs: Organization[]) => void
  setActiveOrg: (org: Organization | null) => void
  clearOrgs: () => void
  setLoading: (v: boolean) => void
}

export const useOrgStore = create<OrgStore>((set) => ({
  orgs: [],
  activeOrg: null,
  isLoading: true,
  setOrgs: (orgs) => set({ orgs }),
  setActiveOrg: (org) => {
    if (org) localStorage.setItem(STORAGE_KEY, org.id)
    else localStorage.removeItem(STORAGE_KEY)
    set({ activeOrg: org })
  },
  clearOrgs: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ orgs: [], activeOrg: null, isLoading: false })
  },
  setLoading: (isLoading) => set({ isLoading }),
}))

export function getSavedOrgId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}
