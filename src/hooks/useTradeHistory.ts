import { useEffect, useState } from 'react'
import type { AccountSummary, AssetType, Trade } from '@/types'
import { getPositions, getTrades } from '../api/client'

export interface TradeHistoryRow extends Trade {
  accountId: string
  accountName: string
  assetType: AssetType | null
  name?: string
}

export interface UseTradeHistoryResult {
  rows: TradeHistoryRow[]
  isLoading: boolean
  error: string | null
}

/** Вся история сделок по счетам активной организации, с типом актива из позиций (включая закрытые). */
export function useTradeHistory(accounts: AccountSummary[]): UseTradeHistoryResult {
  const accountsKey = accounts.map((a) => `${a.id}:${a.name}`).join(',')
  const [rows, setRows] = useState<TradeHistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountsKey) {
      setRows([])
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const accountEntries = accountsKey.split(',').map((s) => {
      const i = s.indexOf(':')
      return { id: s.slice(0, i), name: s.slice(i + 1) }
    })

    Promise.all(
      accountEntries.map(async (a) => {
        const [trades, positions] = await Promise.all([
          getTrades(a.id).catch((): Trade[] => []),
          getPositions(a.id).catch(() => []),
        ])
        const meta = new Map<string, { assetType: AssetType; name?: string }>()
        positions.forEach((p) => meta.set(p.ticker, { assetType: p.assetType, name: p.name }))
        return trades.map((t): TradeHistoryRow => ({
          ...t,
          accountId: a.id,
          accountName: a.name,
          assetType: meta.get(t.ticker)?.assetType ?? null,
          name: meta.get(t.ticker)?.name,
        }))
      })
    ).then((byAccount) => {
      if (cancelled) return
      setRows(byAccount.flat().sort((x, y) => y.executedAt.localeCompare(x.executedAt)))
    }).catch((err: unknown) => {
      if (cancelled) return
      setError(err instanceof Error ? err.message : String(err))
    }).finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [accountsKey])

  return { rows, isLoading, error }
}
