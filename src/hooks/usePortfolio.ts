import { useState, useEffect } from 'react'
import type { AccountSummary, PortfolioSummary } from '@/types'
import { getPortfolioSummary } from '../api/client'
import { usePortfolioStore } from '../store/portfolioStore'
import { useOrgStore } from '../store/orgStore'

export interface UsePortfolioResult {
  summary: PortfolioSummary | null
  accounts: AccountSummary[]
  isLoading: boolean
  error: string | null
}

export function usePortfolio(): UsePortfolioResult {
  const version = usePortfolioStore((s) => s.version)
  const activeOrgId = useOrgStore((s) => s.activeOrg?.id)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [accounts, setAccounts] = useState<AccountSummary[]>([])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    getPortfolioSummary()
      .then((data) => {
        if (cancelled) return
        const { accounts: accs, ...rest } = data
        setSummary(rest as PortfolioSummary)
        setAccounts(accs)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [version, activeOrgId])

  return { summary, accounts, isLoading, error }
}
