import { useEffect, useMemo, useState } from 'react'
import type { AccountSummary, AssetType } from '@/types'
import { getIndexHistory, getPriceHistory } from '../api/client'

export interface BenchmarkPositionRow {
  ticker: string
  name?: string
  accountName: string
  assetType: AssetType
  portfolioWeight: number
  /** Изменение цены позиции за период, % (null — нет данных истории). */
  positionReturn: number | null
  /** Изменение бенчмарка за тот же период: IMOEX для акций, RGBI для облигаций. */
  benchmarkReturn: number | null
  /** Альфа позиции: positionReturn − benchmarkReturn. */
  alpha: number | null
}

export interface UseBenchmarkResult {
  isLoading: boolean
  error: string | null
  days: number
  imoexReturn: number | null
  rgbiReturn: number | null
  /** Альфа портфеля: средневзвешенная альфа по позициям, для которых есть данные. */
  portfolioAlpha: number | null
  positions: BenchmarkPositionRow[]
  outperformers: BenchmarkPositionRow[]
  underperformers: BenchmarkPositionRow[]
}

/** Изменение цены за период по первой и последней точке истории, %. */
function periodReturn(prices: number[]): number | null {
  if (prices.length < 2) return null
  const first = prices[0]
  const last = prices[prices.length - 1]
  if (!first) return null
  return ((last - first) / first) * 100
}

/** Сравнение позиций портфеля с бенчмарками IMOEX (акции) и RGBI (облигации) за период. */
export function useBenchmark(accounts: AccountSummary[], days: number): UseBenchmarkResult {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imoexReturn, setImoexReturn] = useState<number | null>(null)
  const [rgbiReturn, setRgbiReturn] = useState<number | null>(null)
  const [returns, setReturns] = useState<Map<string, number | null>>(new Map())

  const positionsList = useMemo(() => {
    const map = new Map<string, { ticker: string; name?: string; accountName: string; assetType: AssetType; portfolioWeight: number }>()
    for (const acc of accounts) {
      for (const r of acc.equityRows) {
        const key = `${r.position.ticker}__equity`
        const prev = map.get(key)
        if (prev) prev.portfolioWeight += r.portfolioWeight
        else map.set(key, { ticker: r.position.ticker, name: r.position.name, accountName: acc.name, assetType: 'equity', portfolioWeight: r.portfolioWeight })
      }
      for (const r of acc.bondRows) {
        const key = `${r.position.ticker}__bond`
        const prev = map.get(key)
        if (prev) prev.portfolioWeight += r.portfolioWeight
        else map.set(key, { ticker: r.position.ticker, name: r.position.name, accountName: acc.name, assetType: 'bond', portfolioWeight: r.portfolioWeight })
      }
    }
    return [...map.values()]
  }, [accounts])

  const positionsKey = positionsList.map((p) => `${p.ticker}:${p.assetType}`).join(',')

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const tickers = positionsKey
      ? positionsKey.split(',').map((s) => {
          const [ticker, assetType] = s.split(':')
          return { ticker, assetType: assetType as AssetType }
        })
      : []

    Promise.all([
      getIndexHistory('IMOEX', days).catch(() => ({ index: 'IMOEX', dates: [], prices: [] })),
      getIndexHistory('RGBI', days).catch(() => ({ index: 'RGBI', dates: [], prices: [] })),
      Promise.all(
        tickers.map((t) =>
          getPriceHistory(t.ticker, t.assetType === 'bond' ? 'bond' : 'equity', days)
            .then((r) => [`${t.ticker}__${t.assetType}`, periodReturn(r.prices)] as const)
            .catch(() => [`${t.ticker}__${t.assetType}`, null] as const)
        )
      ),
    ])
      .then(([imoex, rgbi, posReturns]) => {
        if (cancelled) return
        setImoexReturn(periodReturn(imoex.prices))
        setRgbiReturn(periodReturn(rgbi.prices))
        setReturns(new Map(posReturns))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [positionsKey, days])

  const positions = useMemo<BenchmarkPositionRow[]>(() => {
    return positionsList.map((p) => {
      const positionReturn = returns.get(`${p.ticker}__${p.assetType}`) ?? null
      const benchmarkReturn = p.assetType === 'bond' ? rgbiReturn : imoexReturn
      const alpha = positionReturn != null && benchmarkReturn != null ? positionReturn - benchmarkReturn : null
      return { ...p, positionReturn, benchmarkReturn, alpha }
    })
  }, [positionsList, returns, imoexReturn, rgbiReturn])

  const withAlpha = positions.filter((p): p is BenchmarkPositionRow & { alpha: number } => p.alpha != null)
  const totalWeight = withAlpha.reduce((s, p) => s + p.portfolioWeight, 0)
  const portfolioAlpha = totalWeight > 0
    ? withAlpha.reduce((s, p) => s + p.alpha * p.portfolioWeight, 0) / totalWeight
    : null

  const outperformers = withAlpha.filter((p) => p.alpha > 0).sort((a, b) => b.alpha - a.alpha).slice(0, 5)
  const underperformers = withAlpha.filter((p) => p.alpha < 0).sort((a, b) => a.alpha - b.alpha).slice(0, 5)

  return {
    isLoading,
    error,
    days,
    imoexReturn,
    rgbiReturn,
    portfolioAlpha,
    positions,
    outperformers,
    underperformers,
  }
}
