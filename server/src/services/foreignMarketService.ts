interface YahooChartMeta {
  regularMarketPrice?: number
  currency?: string
}

interface YahooChartResult {
  meta: YahooChartMeta
  timestamp?: number[]
  indicators?: {
    quote?: { close?: (number | null)[] }[]
  }
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null
  }
}

interface YahooSearchQuote {
  symbol?: string
  shortname?: string
  longname?: string
  exchange?: string
  quoteType?: string
}

interface YahooSearchResponse {
  quotes?: YahooSearchQuote[]
}

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; InvestAnalitic/1.0)' }

async function fetchChart(ticker: string, range: string, interval: string): Promise<YahooChartResult | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000) })
  if (!res.ok) return null
  const body = (await res.json()) as YahooChartResponse
  return body.chart?.result?.[0] ?? null
}

/** Текущая цена и валюта инструмента с иностранных площадок (NASDAQ, NYSE, SPB и др.) через Yahoo Finance. */
export async function fetchForeignQuote(ticker: string): Promise<{ price: number; currency: string } | null> {
  try {
    const result = await fetchChart(ticker, '5d', '1d')
    const price = result?.meta?.regularMarketPrice
    if (typeof price !== 'number' || price <= 0) return null
    return { price, currency: result?.meta?.currency ?? 'USD' }
  } catch {
    return null
  }
}

/** Только текущая цена — для обновления позиций портфеля. */
export async function fetchForeignPrice(ticker: string): Promise<number | null> {
  const quote = await fetchForeignQuote(ticker)
  return quote?.price ?? null
}

function rangeForDays(days: number): string {
  if (days <= 5) return '5d'
  if (days <= 30) return '1mo'
  if (days <= 90) return '3mo'
  if (days <= 180) return '6mo'
  if (days <= 365) return '1y'
  return '2y'
}

/** Дневные цены закрытия за указанный период через Yahoo Finance. */
export async function fetchForeignPriceHistory(ticker: string, days: number): Promise<{ dates: string[]; prices: number[] }> {
  try {
    const result = await fetchChart(ticker, rangeForDays(days), '1d')
    const timestamps = result?.timestamp ?? []
    const closes = result?.indicators?.quote?.[0]?.close ?? []
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

    const dates: string[] = []
    const prices: number[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i]
      const ts = timestamps[i] * 1000
      if (typeof close !== 'number' || ts < cutoff) continue
      dates.push(new Date(ts).toISOString().slice(0, 10))
      prices.push(close)
    }
    return { dates, prices }
  } catch {
    return { dates: [], prices: [] }
  }
}

export interface ForeignSecurityResult {
  ticker: string
  shortName: string
  fullName: string
  isin: string | null
  assetType: 'equity' | 'bond' | null
  currency: 'RUB' | 'USD' | 'EUR'
  exchange: string
  isTraded: boolean
}

const EXCHANGE_BY_YAHOO_CODE: Record<string, string> = {
  NMS: 'NASDAQ', NGM: 'NASDAQ', NCM: 'NASDAQ',
  NYQ: 'NYSE', ASE: 'NYSE', PCX: 'NYSE', BTS: 'NYSE',
}

/** Поиск иностранных акций и ETF (NASDAQ/NYSE) через Yahoo Finance. */
export async function searchForeignSecurities(q: string): Promise<ForeignSecurityResult[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&lang=en-US`
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const body = (await res.json()) as YahooSearchResponse
    const quotes = body.quotes ?? []

    return quotes
      .filter((item) => (item.quoteType === 'EQUITY' || item.quoteType === 'ETF') && item.symbol && !item.symbol.includes('.'))
      .map((item): ForeignSecurityResult => ({
        ticker: item.symbol as string,
        shortName: item.shortname ?? (item.symbol as string),
        fullName: item.longname ?? item.shortname ?? (item.symbol as string),
        isin: null,
        assetType: 'equity',
        currency: 'USD',
        exchange: EXCHANGE_BY_YAHOO_CODE[item.exchange ?? ''] ?? 'NASDAQ',
        isTraded: true,
      }))
      .slice(0, 8)
  } catch {
    return []
  }
}
