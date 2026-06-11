import { useEffect, useMemo, useState } from 'react'
import type { AccountSummary, AssetType, Currency, Payment } from '@/types'
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
  currency: Currency
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

/** Доля портфеля (включая денежные остатки) в одной валюте — для оценки валютного риска. */
export interface CurrencyExposureSlice {
  currency: string
  value: number
  weight: number
  color: string
}

/** Фильтры аналитики: портфель (счёт), тип актива, конкретная бумага. 'all' — без ограничения. */
export interface AnalyticsFilters {
  accountId: string
  assetType: 'all' | AssetType
  ticker: string
}

export interface UseAnalyticsResult {
  isLoading: boolean
  error: string | null
  positionsCount: number
  positionsValue: number
  hhi: number | null
  hhiLevel: 'low' | 'moderate' | 'high' | null
  weightedYtm: number | null
  weightedDaysToMaturity: number | null
  /** Дюрация облигационной части в годах (упрощённо — средневзвешенный срок до погашения). */
  bondDurationYears: number | null
  bondValue: number
  /** Ожидаемый годовой купонный доход облигаций по текущим ставкам и ценам, ₽. */
  forwardBondCoupon: number
  /** Форвардная доходность облигационной части — годовой купон к текущей стоимости, %. */
  forwardBondYield: number | null
  monthlyIncome: MonthlyIncomePoint[]
  trailingIncome: number
  trailingYield: number | null
  topPositions: PortfolioPositionRow[]
  topGainers: PortfolioPositionRow[]
  topLosers: PortfolioPositionRow[]
  composition: CompositionSlice[]
  /** Все позиции в выборке (для сценарного калькулятора). */
  positions: PortfolioPositionRow[]
  /** Денежные остатки выбранных счетов в рублёвом эквиваленте. */
  cashValue: number
  /** Стоимость позиций + денежные остатки выбранных счетов, ₽. */
  totalValue: number
  /** Структура портфеля по валютам (включая кэш), для оценки валютного риска. */
  currencyExposure: CurrencyExposureSlice[]
  /** Суммарная стоимость позиций и остатков в иностранной валюте, ₽. */
  foreignCurrencyValue: number
}

const CURRENCY_COLORS: Record<string, string> = {
  RUB: 'var(--azure-500)',
  USD: 'var(--gain-500)',
  EUR: 'var(--violet-500)',
  CNY: 'var(--amber-500)',
}
const CURRENCY_FALLBACK_COLOR = 'var(--azure-300)'

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

export const ANALYTICS_FILTERS_DEFAULT: AnalyticsFilters = { accountId: 'all', assetType: 'all', ticker: 'all' }

/** Метрики качества портфеля: концентрация (HHI), YTM/срок облигаций, дивидендный поток за 12 мес, лидеры/аутсайдеры. */
export function useAnalytics(accounts: AccountSummary[], filters: AnalyticsFilters = ANALYTICS_FILTERS_DEFAULT): UseAnalyticsResult {
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

  const filteredAccounts = filters.accountId === 'all'
    ? accounts
    : accounts.filter((a) => a.id === filters.accountId)

  const tickerMatches = (ticker: string) => filters.ticker === 'all' || ticker === filters.ticker
  const includesAssetType = (type: AssetType) => filters.assetType === 'all' || filters.assetType === type

  const rawPositions = useMemo(() => filteredAccounts.flatMap((a) => [
    ...(includesAssetType('equity') ? a.equityRows.filter((r) => tickerMatches(r.position.ticker)).map((r): PortfolioPositionRow => ({
      ticker: r.position.ticker,
      name: r.position.name,
      assetType: 'equity',
      accountName: a.name,
      currency: r.position.currency,
      currentValue: r.currentValue,
      portfolioWeight: 0,
      unrealizedPnl: r.unrealizedPnl,
      unrealizedPnlPercent: r.unrealizedPnlPercent,
    })) : []),
    ...(includesAssetType('bond') ? a.bondRows.filter((r) => tickerMatches(r.position.ticker)).map((r): PortfolioPositionRow => ({
      ticker: r.position.ticker,
      name: r.position.name,
      assetType: 'bond',
      accountName: a.name,
      currency: r.position.currency,
      currentValue: r.currentValue,
      portfolioWeight: 0,
      unrealizedPnl: r.unrealizedPnl,
      unrealizedPnlPercent: r.unrealizedPnlPercent,
    })) : []),
  ]), [filteredAccounts, filters.assetType, filters.ticker])

  const positionsValue = rawPositions.reduce((s, p) => s + p.currentValue, 0)
  const positions = rawPositions.map((p) => ({
    ...p,
    portfolioWeight: positionsValue > 0 ? (p.currentValue / positionsValue) * 100 : 0,
  }))

  const hhi = positions.length > 0
    ? positions.reduce((s, p) => s + (p.portfolioWeight / 100) ** 2, 0)
    : null

  const hhiLevel: UseAnalyticsResult['hhiLevel'] = hhi == null ? null
    : hhi < 0.15 ? 'low'
    : hhi < 0.25 ? 'moderate'
    : 'high'

  const allBonds = includesAssetType('bond')
    ? filteredAccounts.flatMap((a) => a.bondRows.filter((r) => tickerMatches(r.position.ticker)))
    : []
  const bondValue = allBonds.reduce((s, r) => s + r.currentValue, 0)

  const ytmRows = allBonds.filter((r) => r.ytm != null)
  const weightedYtm = bondValue > 0 && ytmRows.length > 0
    ? ytmRows.reduce((s, r) => s + (r.ytm as number) * r.currentValue, 0) / bondValue
    : null

  const maturityRows = allBonds.filter((r) => r.daysToMaturity != null)
  const weightedDaysToMaturity = bondValue > 0 && maturityRows.length > 0
    ? maturityRows.reduce((s, r) => s + (r.daysToMaturity as number) * r.currentValue, 0) / bondValue
    : null
  const bondDurationYears = weightedDaysToMaturity != null ? weightedDaysToMaturity / 365.25 : null

  // Форвардный купонный доход: годовой купон по текущей купонной ставке к текущей цене каждой бумаги
  const forwardBondCoupon = allBonds.reduce((s, r) => s + (r.currentYield != null ? (r.currentYield / 100) * r.currentValue : 0), 0)
  const forwardBondYield = bondValue > 0 ? (forwardBondCoupon / bondValue) * 100 : null

  // Валютная структура портфеля: позиции + денежные остатки выбранных счетов (без фильтра по типу актива/тикеру —
  // это срез по риску всей выбранной части портфеля, а не только отфильтрованной таблицы)
  const scenarioEquityRows = filteredAccounts.flatMap((a) => a.equityRows)
  const scenarioBondRows = filteredAccounts.flatMap((a) => a.bondRows)
  const scenarioCashRows = filteredAccounts.flatMap((a) => a.cashRows)

  const scenarioPositionsValue = scenarioEquityRows.reduce((s, r) => s + r.currentValue, 0)
    + scenarioBondRows.reduce((s, r) => s + r.currentValue, 0)
  const cashValue = scenarioCashRows.reduce((s, r) => s + r.rubEquivalent, 0)
  const totalValue = scenarioPositionsValue + cashValue

  const currencyMap = new Map<string, number>()
  for (const r of [...scenarioEquityRows, ...scenarioBondRows]) {
    currencyMap.set(r.position.currency, (currencyMap.get(r.position.currency) ?? 0) + r.currentValue)
  }
  for (const r of scenarioCashRows) {
    currencyMap.set(r.balance.currency, (currencyMap.get(r.balance.currency) ?? 0) + r.rubEquivalent)
  }

  const currencyExposure: CurrencyExposureSlice[] = Array.from(currencyMap.entries())
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([currency, value]) => ({
      currency,
      value,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: CURRENCY_COLORS[currency] ?? CURRENCY_FALLBACK_COLOR,
    }))

  const foreignCurrencyValue = totalValue - (currencyMap.get('RUB') ?? 0)

  const filteredAccountIds = new Set(filteredAccounts.map((a) => a.id))
  const relevantPayments = payments.filter((p) =>
    (p.type === 'dividend' || p.type === 'coupon') &&
    filteredAccountIds.has(p.accountId) &&
    tickerMatches(p.ticker) &&
    (filters.assetType === 'all' || (filters.assetType === 'equity' ? p.type === 'dividend' : p.type === 'coupon'))
  )

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
    for (const p of relevantPayments) {
      const bucket = buckets.get(p.paymentDate.slice(0, 7))
      if (!bucket) continue
      if (p.type === 'dividend') bucket.dividends += p.netAmount
      else bucket.coupons += p.netAmount
      bucket.total += p.netAmount
    }
    return Array.from(buckets.values())
  }, [relevantPayments])

  const trailingIncome = monthlyIncome.reduce((s, m) => s + m.total, 0)
  const trailingYield = positionsValue > 0 ? (trailingIncome / positionsValue) * 100 : null

  const sortedByWeight = [...positions].sort((a, b) => b.portfolioWeight - a.portfolioWeight)
  const topPositions = sortedByWeight.slice(0, 5)

  const sortedByPnl = [...positions].sort((a, b) => b.unrealizedPnlPercent - a.unrealizedPnlPercent)
  const topGainers = sortedByPnl.filter((p) => p.unrealizedPnlPercent > 0).slice(0, 5)
  const topLosers = sortedByPnl.filter((p) => p.unrealizedPnlPercent < 0).slice(-5).reverse()

  const sortedByValue = [...positions].sort((a, b) => b.currentValue - a.currentValue)
  const composition: CompositionSlice[] = sortedByValue.slice(0, COMPOSITION_TOP_N).map((p, i) => ({
    label: p.ticker,
    value: p.currentValue,
    weight: p.portfolioWeight,
    color: COMPOSITION_COLORS[i % COMPOSITION_COLORS.length],
  }))
  const restValue = sortedByValue.slice(COMPOSITION_TOP_N).reduce((s, p) => s + p.currentValue, 0)
  if (restValue > 0) {
    composition.push({
      label: 'Остальное',
      value: restValue,
      weight: positionsValue > 0 ? (restValue / positionsValue) * 100 : 0,
      color: COMPOSITION_OTHER_COLOR,
    })
  }

  return {
    isLoading, error,
    positionsCount: positions.length,
    positionsValue,
    hhi, hhiLevel,
    weightedYtm, weightedDaysToMaturity, bondDurationYears, bondValue,
    forwardBondCoupon, forwardBondYield,
    monthlyIncome, trailingIncome, trailingYield,
    topPositions, topGainers, topLosers,
    composition,
    positions, cashValue, totalValue,
    currencyExposure, foreignCurrencyValue,
  }
}
