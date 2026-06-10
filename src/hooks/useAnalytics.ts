import { useEffect, useMemo, useState } from 'react'
import type { AccountSummary, AssetType, Payment } from '@/types'
import { getPayments } from '../api/client'

export interface MonthlyIncomePoint {
  month: string
  label: string
  dividends: number
  coupons: number
  total: number
}

export interface PortfolioPositionRow {
  ticker: string
  name?: string
  assetType: AssetType
  accountName: string
  currentValue: number
  portfolioWeight: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
}

export interface CompositionSlice {
  label: string
  value: number
  weight: number
  color: string
}

export interface UseAnalyticsResult {
  isLoading: boolean
  error: string | null
  positionsCount: number
  hhi: number | null
  hhiLevel: 'low' | 'moderate' | 'high' | null
  weightedYtm: number | null
  weightedDaysToMaturity: number | null
  bondValue: number
  monthlyIncome: MonthlyIncomePoint[]
  trailingIncome: number
  trailingYield: number | null
  topPositions: PortfolioPositionRow[]
  topGainers: PortfolioPositionRow[]
  topLosers: PortfolioPositionRow[]
  composition: CompositionSlice[]
}

const MONTH_LABELS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const COMPOSITION_COLORS = [
  'var(--azure-500)',
  'var(--violet-500)',
  'var(--amber-500)',
  'var(--gain-500)',
  'var(--loss-500)',
  'var(--azure-300)',
]
const COMPOSITION_OTHER_COLOR = 'var(--ink-300)'
const COMPOSITION_TOP_N = 6

/** Метрики качества портфеля: концентрация (HHI), YTM/срок облигаций, дивидендный поток за 12 мес, лидеры/аутсайдеры. */
export function useAnalytics(accounts: AccountSummary[], totalValue: number): UseAnalyticsResult {
  const accountsKey = accounts.map((a) => `${a.id}:${a.name}`).join(',')
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountsKey) {
      setPayments([])
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const ids = accountsKey.split(',').map((s) => s.slice(0, s.indexOf(':')))

    Promise.all(ids.map((id) => getPayments(id).catch((): Payment[] => [])))
      .then((byAccount) => { if (!cancelled) setPayments(byAccount.flat()) })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)) })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [accountsKey])

  const positions = useMemo<PortfolioPositionRow[]>(() => accounts.flatMap((a) => [
    ...a.equityRows.map((r): PortfolioPositionRow => ({
      ticker: r.position.ticker,
      name: r.position.name,
      assetType: 'equity',
      accountName: a.name,
      currentValue: r.currentValue,
      portfolioWeight: r.portfolioWeight,
      unrealizedPnl: r.unrealizedPnl,
      unrealizedPnlPercent: r.unrealizedPnlPercent,
    })),
    ...a.bondRows.map((r): PortfolioPositionRow => ({
      ticker: r.position.ticker,
      name: r.position.name,
      assetType: 'bond',
      accountName: a.name,
      currentValue: r.currentValue,
      portfolioWeight: r.portfolioWeight,
      unrealizedPnl: r.unrealizedPnl,
      unrealizedPnlPercent: r.unrealizedPnlPercent,
    })),
  ]), [accounts])

  const hhi = positions.length > 0
    ? positions.reduce((s, p) => s + (p.portfolioWeight / 100) ** 2, 0)
    : null

  const hhiLevel: UseAnalyticsResult['hhiLevel'] = hhi == null ? null
    : hhi < 0.15 ? 'low'
    : hhi < 0.25 ? 'moderate'
    : 'high'

  const allBonds = accounts.flatMap((a) => a.bondRows)
  const bondValue = allBonds.reduce((s, r) => s + r.currentValue, 0)

  const ytmRows = allBonds.filter((r) => r.ytm != null)
  const weightedYtm = bondValue > 0 && ytmRows.length > 0
    ? ytmRows.reduce((s, r) => s + (r.ytm as number) * r.currentValue, 0) / bondValue
    : null

  const maturityRows = allBonds.filter((r) => r.daysToMaturity != null)
  const weightedDaysToMaturity = bondValue > 0 && maturityRows.length > 0
    ? maturityRows.reduce((s, r) => s + (r.daysToMaturity as number) * r.currentValue, 0) / bondValue
    : null

  const monthlyIncome = useMemo<MonthlyIncomePoint[]>(() => {
    const now = new Date()
    const buckets = new Map<string, MonthlyIncomePoint>()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets.set(key, {
        month: key,
        label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        dividends: 0,
        coupons: 0,
        total: 0,
      })
    }
    for (const p of payments) {
      const bucket = buckets.get(p.paymentDate.slice(0, 7))
      if (!bucket) continue
      if (p.type === 'dividend') bucket.dividends += p.netAmount
      else bucket.coupons += p.netAmount
      bucket.total += p.netAmount
    }
    return Array.from(buckets.values())
  }, [payments])

  const trailingIncome = monthlyIncome.reduce((s, m) => s + m.total, 0)
  const trailingYield = totalValue > 0 ? (trailingIncome / totalValue) * 100 : null

  const sortedByWeight = [...positions].sort((a, b) => b.portfolioWeight - a.portfolioWeight)
  const topPositions = sortedByWeight.slice(0, 5)

  const sortedByPnl = [...positions].sort((a, b) => b.unrealizedPnlPercent - a.unrealizedPnlPercent)
  const topGainers = sortedByPnl.filter((p) => p.unrealizedPnlPercent > 0).slice(0, 5)
  const topLosers = sortedByPnl.filter((p) => p.unrealizedPnlPercent < 0).slice(-5).reverse()

  const compositionTotal = positions.reduce((s, p) => s + p.currentValue, 0)
  const sortedByValue = [...positions].sort((a, b) => b.currentValue - a.currentValue)
  const composition: CompositionSlice[] = sortedByValue.slice(0, COMPOSITION_TOP_N).map((p, i) => ({
    label: p.ticker,
    value: p.currentValue,
    weight: compositionTotal > 0 ? (p.currentValue / compositionTotal) * 100 : 0,
    color: COMPOSITION_COLORS[i % COMPOSITION_COLORS.length],
  }))
  const restValue = sortedByValue.slice(COMPOSITION_TOP_N).reduce((s, p) => s + p.currentValue, 0)
  if (restValue > 0) {
    composition.push({
      label: 'Остальное',
      value: restValue,
      weight: compositionTotal > 0 ? (restValue / compositionTotal) * 100 : 0,
      color: COMPOSITION_OTHER_COLOR,
    })
  }

  return {
    isLoading, error,
    positionsCount: positions.length,
    hhi, hhiLevel,
    weightedYtm, weightedDaysToMaturity, bondValue,
    monthlyIncome, trailingIncome, trailingYield,
    topPositions, topGainers, topLosers,
    composition,
  }
}
