import { useEffect, useMemo, useState } from 'react'
import type { AccountSummary, EquityRow, Payment, Trade } from '@/types'
import { getPayments, getPriceHistory, getTrades } from '../api/client'

export interface AssetAccountRow extends EquityRow {
  accountId: string
  accountName: string
}

export interface AssetTradeRow extends Trade {
  accountName: string
}

export interface AssetPaymentRow extends Payment {
  accountName: string
}

export interface AssetPerformancePoint {
  label: string
  percent: number | null
}

export interface UseAssetDetailResult {
  rows: AssetAccountRow[]
  position: EquityRow['position'] | null
  totalQuantity: number
  averagePrice: number
  currentPrice: number
  currentValue: number
  investedValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  dayChange: number | null
  dayChangePercent: number | null
  trades: AssetTradeRow[]
  payments: AssetPaymentRow[]
  firstTradeDate: string | null
  totalBought: number
  totalSold: number
  priceHistory: { dates: string[]; prices: number[] }
  performance: AssetPerformancePoint[]
  isLoading: boolean
}

const PERFORMANCE_PERIODS = [
  { label: 'День', days: 1 },
  { label: 'Неделя', days: 5 },
  { label: 'Месяц', days: 21 },
  { label: '3 мес', days: 63 },
  { label: '6 мес', days: 126 },
  { label: 'Год', days: 252 },
]

/** Агрегирует позицию по тикеру (акция) во всех счетах текущей организации, плюс сделки/выплаты/история цен. */
export function useAssetDetail(ticker: string, accounts: AccountSummary[]): UseAssetDetailResult {
  const rows = useMemo<AssetAccountRow[]>(
    () => accounts.flatMap((a) =>
      a.equityRows
        .filter((r) => r.position.ticker === ticker)
        .map((r) => ({ ...r, accountId: a.id, accountName: a.name }))
    ),
    [accounts, ticker]
  )

  const accountsKey = rows.map((r) => `${r.accountId}:${r.accountName}`).sort().join(',')

  const [trades, setTrades] = useState<AssetTradeRow[]>([])
  const [payments, setPayments] = useState<AssetPaymentRow[]>([])
  const [priceHistory, setPriceHistory] = useState<{ dates: string[]; prices: number[] }>({ dates: [], prices: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!ticker || !accountsKey) {
      setTrades([])
      setPayments([])
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)

    const accountEntries = accountsKey.split(',').map((s) => {
      const i = s.indexOf(':')
      return { id: s.slice(0, i), name: s.slice(i + 1) }
    })

    Promise.all([
      Promise.all(accountEntries.map((a) =>
        getTrades(a.id, ticker)
          .then((ts): AssetTradeRow[] => ts.map((t) => ({ ...t, accountName: a.name })))
          .catch((): AssetTradeRow[] => [])
      )),
      Promise.all(accountEntries.map((a) =>
        getPayments(a.id)
          .then((ps): AssetPaymentRow[] => ps.filter((p) => p.ticker === ticker).map((p) => ({ ...p, accountName: a.name })))
          .catch((): AssetPaymentRow[] => [])
      )),
      getPriceHistory(ticker, 'equity', 365).catch(() => ({ ticker, dates: [], prices: [] })),
    ]).then(([tradesByAcc, paymentsByAcc, history]) => {
      if (cancelled) return
      setTrades(tradesByAcc.flat().sort((a, b) => b.executedAt.localeCompare(a.executedAt)))
      setPayments(paymentsByAcc.flat().sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)))
      setPriceHistory({ dates: history.dates, prices: history.prices })
    }).finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [ticker, accountsKey])

  const totalQuantity = rows.reduce((s, r) => s + r.position.quantity, 0)
  const investedValue = rows.reduce((s, r) => s + r.investedValue, 0)
  const currentValue = rows.reduce((s, r) => s + r.currentValue, 0)
  const unrealizedPnl = rows.reduce((s, r) => s + r.unrealizedPnl, 0)
  const unrealizedPnlPercent = investedValue > 0 ? (unrealizedPnl / investedValue) * 100 : 0

  const hasDayChange = rows.some((r) => r.dayChange != null)
  const dayChange = hasDayChange ? rows.reduce((s, r) => s + (r.dayChange ?? 0), 0) : null
  const prevValue = dayChange != null ? currentValue - dayChange : null
  const dayChangePercent = dayChange != null && prevValue ? (dayChange / prevValue) * 100 : null

  const averagePrice = totalQuantity > 0
    ? rows.reduce((s, r) => s + r.position.averagePrice * r.position.quantity, 0) / totalQuantity
    : 0
  const currentPrice = rows[0]?.currentPrice ?? 0
  const position = rows[0]?.position ?? null

  const buyTrades = trades.filter((t) => t.side === 'buy')
  const sellTrades = trades.filter((t) => t.side === 'sell')
  const totalBought = buyTrades.reduce((s, t) => s + t.quantity * t.price + t.fee, 0)
  const totalSold = sellTrades.reduce((s, t) => s + (t.quantity * t.price - t.fee), 0)
  const firstTradeDate = trades.length > 0
    ? trades.reduce((min, t) => (t.executedAt < min ? t.executedAt : min), trades[0].executedAt)
    : null

  const performance = useMemo<AssetPerformancePoint[]>(() => {
    const { prices } = priceHistory
    if (prices.length < 2) return []
    const last = prices[prices.length - 1]
    return PERFORMANCE_PERIODS
      .filter((p) => prices.length > p.days)
      .map((p) => {
        const base = prices[prices.length - 1 - p.days]
        return { label: p.label, percent: base !== 0 ? ((last - base) / base) * 100 : null }
      })
  }, [priceHistory])

  return {
    rows, position, totalQuantity, averagePrice, currentPrice, currentValue, investedValue,
    unrealizedPnl, unrealizedPnlPercent, dayChange, dayChangePercent,
    trades, payments, firstTradeDate, totalBought, totalSold, priceHistory, performance, isLoading,
  }
}
