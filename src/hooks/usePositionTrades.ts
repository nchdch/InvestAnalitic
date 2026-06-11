import { useEffect, useState } from 'react'
import { getTrades } from '../api/client'

export interface PositionTradeStats {
  totalBought: number
  totalSold: number
  firstTradeDate: string | null
  tradesCount: number
}

const EMPTY_STATS: PositionTradeStats = { totalBought: 0, totalSold: 0, firstTradeDate: null, tradesCount: 0 }

const cache = new Map<string, PositionTradeStats>()

/** Итоги сделок по одной позиции (счёт + тикер): сумма покупок/продаж и дата первой сделки. Загружается лениво при раскрытии строки. */
export function usePositionTrades(accountId: string, ticker: string, enabled: boolean): { stats: PositionTradeStats | null; isLoading: boolean } {
  const key = `${accountId}:${ticker}`
  const [stats, setStats] = useState<PositionTradeStats | null>(cache.get(key) ?? null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || cache.has(key)) return
    let cancelled = false
    setIsLoading(true)

    getTrades(accountId, ticker)
      .then((trades) => {
        if (cancelled) return
        const buy = trades.filter((t) => t.side === 'buy')
        const sell = trades.filter((t) => t.side === 'sell')
        const result: PositionTradeStats = {
          totalBought: buy.reduce((s, t) => s + t.quantity * t.price + t.fee, 0),
          totalSold: sell.reduce((s, t) => s + (t.quantity * t.price - t.fee), 0),
          firstTradeDate: trades.length > 0
            ? trades.reduce((min, t) => (t.executedAt < min ? t.executedAt : min), trades[0].executedAt)
            : null,
          tradesCount: trades.length,
        }
        cache.set(key, result)
        setStats(result)
      })
      .catch(() => { if (!cancelled) setStats(EMPTY_STATS) })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [enabled, key, accountId, ticker])

  return { stats, isLoading }
}
