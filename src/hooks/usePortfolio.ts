import { useState, useEffect, useRef } from 'react'
import type { AccountSummary, PortfolioSummary } from '@/types'
import { getPortfolioSummary } from '../api/client'
import { usePortfolioStore } from '../store/portfolioStore'
import { useOrgStore } from '../store/orgStore'

export interface UsePortfolioResult {
  summary: PortfolioSummary | null
  accounts: AccountSummary[]
  /** Счета с учётом портфеля, выбранного в сайдбаре (все счета, если выбор не задан — «Все портфели»). */
  filteredAccounts: AccountSummary[]
  /** Сводка для текущего выбора: равна summary при «Все портфели», иначе — показатели выбранного счёта. */
  filteredSummary: PortfolioSummary | null
  isLoading: boolean
  error: string | null
}

export function usePortfolio(): UsePortfolioResult {
  const version = usePortfolioStore((s) => s.version)
  const selectedAccountId = usePortfolioStore((s) => s.selectedAccountId)
  const activeOrgId = useOrgStore((s) => s.activeOrg?.id)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [accounts, setAccounts] = useState<AccountSummary[]>([])
  const loadedOrgRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    // Спиннер показываем только при первой загрузке / смене организации.
    // Фоновое обновление котировок (bump()) не должно перерисовывать страницу
    // с нуля — это сбрасывает открытые модалки и несохранённые формы.
    if (loadedOrgRef.current !== activeOrgId) setIsLoading(true)
    setError(null)

    getPortfolioSummary()
      .then((data) => {
        if (cancelled) return
        const { accounts: accs, ...rest } = data
        setSummary(rest as PortfolioSummary)
        setAccounts(accs)
        loadedOrgRef.current = activeOrgId
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [version, activeOrgId])

  const selectedAccount = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) ?? null : null
  const filteredAccounts = selectedAccount ? [selectedAccount] : accounts

  const filteredSummary: PortfolioSummary | null = summary && selectedAccount
    ? {
        ...summary,
        totalValue: selectedAccount.totalValue,
        investedValue: selectedAccount.investedValue,
        dayChange: selectedAccount.dayChange,
        equityValue: selectedAccount.equityRows.reduce((s, r) => s + r.currentValue, 0),
        bondValue: selectedAccount.bondRows.reduce((s, r) => s + r.currentValue, 0),
        cashValue: selectedAccount.cashRows.reduce((s, r) => s + r.rubEquivalent, 0),
        unrealizedPnl: selectedAccount.unrealizedPnl,
        unrealizedPnlPercent: selectedAccount.unrealizedPnlPercent,
      }
    : summary

  return { summary, accounts, filteredAccounts, filteredSummary, isLoading, error }
}
