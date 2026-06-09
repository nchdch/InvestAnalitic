import { useState, useEffect, useCallback } from 'react'
import type { AccountSummary, PortfolioSummary } from '@/types'
import { getPortfolioSummary } from '../api/client'

export interface UsePortfolioResult {
  summary: PortfolioSummary | null
  accounts: AccountSummary[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function usePortfolio(): UsePortfolioResult {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [accounts, setAccounts] = useState<AccountSummary[]>([])
  const [tick, setTick] = useState(0)

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
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { summary, accounts, isLoading, error, refetch }
}
