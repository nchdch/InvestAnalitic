import { useEffect, useMemo, useState } from 'react'
import type { AccountSummary } from '@/types'
import { useTradeHistory } from './useTradeHistory'
import type { TradeHistoryRow } from './useTradeHistory'
import { getExchangeRate } from '../api/client'

const TAX_BRACKET_THRESHOLD = 5_000_000
const TAX_RATE_BASE = 0.13
const TAX_RATE_HIGH = 0.15

export interface RealizedLot {
  ticker: string
  name?: string
  accountId: string
  accountName: string
  closeDate: string
  quantity: number
  proceeds: number
  costBasis: number
  pnl: number
  currency: string
}

export interface LossHarvestCandidate {
  ticker: string
  name?: string
  accountId: string
  accountName: string
  unrealizedPnl: number
  potentialTaxSaving: number
}

export interface UseRealizedPnlResult {
  isLoading: boolean
  error: string | null
  /** Год, за который считается реализованный P&L (текущий календарный год). */
  year: number
  lots: RealizedLot[]
  realizedGainsYTD: number
  realizedLossesYTD: number
  /** Налогооблагаемая база: прибыли за вычетом убытков за год, не может быть отрицательной. */
  netTaxableBase: number
  estimatedTax: number
  /** Ставка НДФЛ, применимая к последнему рублю базы (13% или 15%). */
  marginalRate: number
  lossHarvestCandidates: LossHarvestCandidate[]
  potentialTaxSavingTotal: number
}

/** Прогрессивный НДФЛ: 13% до 5 млн ₽ налоговой базы за год, 15% сверх — упрощённая ориентировочная оценка. */
function estimateTax(base: number): number {
  if (base <= 0) return 0
  if (base <= TAX_BRACKET_THRESHOLD) return base * TAX_RATE_BASE
  return TAX_BRACKET_THRESHOLD * TAX_RATE_BASE + (base - TAX_BRACKET_THRESHOLD) * TAX_RATE_HIGH
}

interface FifoLot { quantity: number; unitCost: number }

/** FIFO-расчёт закрытых позиций за год: группирует сделки по счёту и тикеру, сопоставляет продажи с покупками по очереди. */
function computeFifo(trades: TradeHistoryRow[], year: number): RealizedLot[] {
  const groups = new Map<string, TradeHistoryRow[]>()
  for (const t of trades) {
    const key = `${t.accountId}__${t.ticker}`
    const arr = groups.get(key)
    if (arr) arr.push(t)
    else groups.set(key, [t])
  }

  const lots: RealizedLot[] = []
  for (const groupTrades of groups.values()) {
    const sorted = [...groupTrades].sort((a, b) => a.executedAt.localeCompare(b.executedAt))
    const queue: FifoLot[] = []
    for (const t of sorted) {
      if (t.side === 'buy') {
        const unitCost = t.quantity > 0 ? (t.price * t.quantity + t.fee) / t.quantity : 0
        queue.push({ quantity: t.quantity, unitCost })
        continue
      }

      let remaining = t.quantity
      let costBasis = 0
      while (remaining > 1e-9 && queue.length > 0) {
        const lot = queue[0]
        const take = Math.min(lot.quantity, remaining)
        costBasis += take * lot.unitCost
        lot.quantity -= take
        remaining -= take
        if (lot.quantity <= 1e-9) queue.shift()
      }

      const matchedQty = t.quantity - remaining
      if (matchedQty <= 1e-9) continue
      if (new Date(t.executedAt).getFullYear() !== year) continue

      const proceeds = matchedQty * t.price - t.fee * (matchedQty / t.quantity)
      lots.push({
        ticker: t.ticker,
        name: t.name,
        accountId: t.accountId,
        accountName: t.accountName,
        closeDate: t.executedAt,
        quantity: matchedQty,
        proceeds,
        costBasis,
        pnl: proceeds - costBasis,
        currency: t.currency,
      })
    }
  }
  return lots.sort((a, b) => b.closeDate.localeCompare(a.closeDate))
}

/** Реализованный P&L за текущий год (FIFO) и ориентировочная налоговая оптимизация. */
export function useRealizedPnl(accounts: AccountSummary[]): UseRealizedPnlResult {
  const { rows, isLoading: tradesLoading, error } = useTradeHistory(accounts)
  const [rates, setRates] = useState<Map<string, number>>(new Map())
  const [ratesLoading, setRatesLoading] = useState(true)
  const year = new Date().getFullYear()

  const currenciesKey = useMemo(
    () => [...new Set(rows.map((r) => r.currency))].filter((c) => c !== 'RUB').sort().join(','),
    [rows]
  )

  useEffect(() => {
    const currencies = currenciesKey ? currenciesKey.split(',') : []
    if (currencies.length === 0) {
      setRates(new Map())
      setRatesLoading(false)
      return
    }
    let cancelled = false
    setRatesLoading(true)
    Promise.all(currencies.map((c) => getExchangeRate(c).then((r) => [c, r.rate] as const).catch(() => [c, 1] as const)))
      .then((entries) => { if (!cancelled) setRates(new Map(entries)) })
      .finally(() => { if (!cancelled) setRatesLoading(false) })
    return () => { cancelled = true }
  }, [currenciesKey])

  const lotsNative = useMemo(() => computeFifo(rows, year), [rows, year])

  const lots = useMemo(() => lotsNative.map((l) => {
    const rate = l.currency === 'RUB' ? 1 : (rates.get(l.currency) ?? 1)
    return rate === 1 ? l : { ...l, proceeds: l.proceeds * rate, costBasis: l.costBasis * rate, pnl: l.pnl * rate }
  }), [lotsNative, rates])

  const realizedGainsYTD = lots.filter((l) => l.pnl > 0).reduce((s, l) => s + l.pnl, 0)
  const realizedLossesYTD = lots.filter((l) => l.pnl < 0).reduce((s, l) => s - l.pnl, 0)
  const netTaxableBase = Math.max(0, realizedGainsYTD - realizedLossesYTD)
  const estimatedTax = estimateTax(netTaxableBase)
  const marginalRate = netTaxableBase > TAX_BRACKET_THRESHOLD ? TAX_RATE_HIGH : TAX_RATE_BASE

  const lossHarvestCandidates = useMemo<LossHarvestCandidate[]>(() => {
    const result: LossHarvestCandidate[] = []
    for (const acc of accounts) {
      for (const r of [...acc.equityRows, ...acc.bondRows]) {
        if (r.unrealizedPnl < 0) {
          result.push({
            ticker: r.position.ticker,
            name: r.position.name,
            accountId: acc.id,
            accountName: acc.name,
            unrealizedPnl: r.unrealizedPnl,
            potentialTaxSaving: Math.abs(r.unrealizedPnl) * marginalRate,
          })
        }
      }
    }
    return result.sort((a, b) => a.unrealizedPnl - b.unrealizedPnl).slice(0, 5)
  }, [accounts, marginalRate])

  const potentialTaxSavingTotal = Math.min(
    lossHarvestCandidates.reduce((s, c) => s + c.potentialTaxSaving, 0),
    estimatedTax
  )

  return {
    isLoading: tradesLoading || ratesLoading,
    error,
    year,
    lots,
    realizedGainsYTD,
    realizedLossesYTD,
    netTaxableBase,
    estimatedTax,
    marginalRate,
    lossHarvestCandidates,
    potentialTaxSavingTotal,
  }
}
