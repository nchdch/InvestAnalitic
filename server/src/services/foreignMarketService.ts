const FINNHUB_BASE = 'https://finnhub.io/api/v1'

interface FinnhubQuote {
  c?: number  // текущая цена
}

interface FinnhubSearchItem {
  symbol?: string
  description?: string
  type?: string
}

interface FinnhubSearchResponse {
  result?: FinnhubSearchItem[]
}

interface FinnhubCandleResponse {
  s?: string
  t?: number[]
  c?: number[]
}

function apiKey(): string | null {
  return process.env.FINNHUB_API_KEY?.trim() || null
}

/** Текущая цена и валюта инструмента с иностранных площадок (NASDAQ, NYSE, SPB и др.) через Finnhub. */
export async function fetchForeignQuote(ticker: string): Promise<{ price: number; currency: string } | null> {
  const key = apiKey()
  if (!key) return null

  try {
    const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const body = (await res.json()) as FinnhubQuote
    if (typeof body.c !== 'number' || body.c <= 0) return null
    return { price: body.c, currency: 'USD' }
  } catch {
    return null
  }
}

/** Только текущая цена — для обновления позиций портфеля. */
export async function fetchForeignPrice(ticker: string): Promise<number | null> {
  const quote = await fetchForeignQuote(ticker)
  return quote?.price ?? null
}

/** Дневные цены закрытия за указанный период через Finnhub (доступно не на всех тарифах — при отсутствии доступа возвращает пустой результат). */
export async function fetchForeignPriceHistory(ticker: string, days: number): Promise<{ dates: string[]; prices: number[] }> {
  const key = apiKey()
  if (!key) return { dates: [], prices: [] }

  try {
    const to = Math.floor(Date.now() / 1000)
    const from = to - days * 24 * 60 * 60
    const url = `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}&token=${key}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { dates: [], prices: [] }
    const body = (await res.json()) as FinnhubCandleResponse
    if (body.s !== 'ok' || !body.t || !body.c) return { dates: [], prices: [] }

    const dates = body.t.map((ts) => new Date(ts * 1000).toISOString().slice(0, 10))
    return { dates, prices: body.c }
  } catch {
    return { dates: [], prices: [] }
  }
}

const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const YAHOO_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }> | null
  }
}

const yahooHistoryCache = new Map<string, { dates: string[]; prices: number[]; fetchedAt: number }>()
const YAHOO_CACHE_TTL_MS = 60 * 60 * 1000

function yahooRange(days: number): string {
  if (days <= 5) return '5d'
  if (days <= 30) return '1mo'
  if (days <= 90) return '3mo'
  if (days <= 180) return '6mo'
  if (days <= 365) return '1y'
  return '2y'
}

/** Дневные цены закрытия через Yahoo Finance — резерв для иностранных бумаг, история которых недоступна через Finnhub на бесплатном тарифе. */
export async function fetchYahooPriceHistory(ticker: string, days: number): Promise<{ dates: string[]; prices: number[] }> {
  const range = yahooRange(days)
  const cacheKey = `${ticker}:${range}`
  const cached = yahooHistoryCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < YAHOO_CACHE_TTL_MS) {
    return { dates: cached.dates, prices: cached.prices }
  }

  try {
    const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(ticker)}?range=${range}&interval=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': YAHOO_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { dates: [], prices: [] }

    const body = (await res.json()) as YahooChartResponse
    const result = body.chart?.result?.[0]
    const timestamps = result?.timestamp
    const closes = result?.indicators?.quote?.[0]?.close
    if (!timestamps || !closes) return { dates: [], prices: [] }

    const dates: string[] = []
    const prices: number[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i]
      if (typeof close !== 'number') continue
      dates.push(new Date(timestamps[i] * 1000).toISOString().slice(0, 10))
      prices.push(close)
    }

    if (dates.length > 0) yahooHistoryCache.set(cacheKey, { dates, prices, fetchedAt: Date.now() })
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

const FOREIGN_TYPES = new Set(['Common Stock', 'ETP', 'ETF', 'REIT'])
const TICKER_RE = /^[A-Z0-9._-]{1,12}$/

/** Поиск иностранных акций и ETF через Finnhub. */
export async function searchForeignSecurities(q: string): Promise<ForeignSecurityResult[]> {
  const key = apiKey()
  if (!key) return []

  try {
    const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(q)}&token=${key}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const body = (await res.json()) as FinnhubSearchResponse
    const results = body.result ?? []

    const seen = new Set<string>()
    const unique: ForeignSecurityResult[] = []
    for (const item of results) {
      const symbol = item.symbol
      if (!symbol || !TICKER_RE.test(symbol) || !FOREIGN_TYPES.has(item.type ?? '')) continue
      if (seen.has(symbol)) continue
      seen.add(symbol)
      unique.push({
        ticker: symbol,
        shortName: item.description ?? symbol,
        fullName: item.description ?? symbol,
        isin: null,
        assetType: 'equity',
        currency: 'USD',
        exchange: 'NASDAQ',
        isTraded: true,
      })
      if (unique.length >= 8) break
    }
    return unique
  } catch {
    return []
  }
}

interface YahooSearchQuote {
  symbol?: string
  shortname?: string
  longname?: string
  quoteType?: string
  exchange?: string
  typeDisp?: string
}

interface YahooSearchResponse {
  quotes?: YahooSearchQuote[]
}

const YAHOO_QUOTE_TYPES = new Set(['EQUITY', 'ETF', 'MUTUALFUND', 'FUTURE', 'INDEX'])

/** Поиск через Yahoo Finance — покрывает делистованные бумаги и всё глобальное. */
export async function searchYahooSecurities(q: string): Promise<ForeignSecurityResult[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0&enableFuzzyQuery=false`
    const res = await fetch(url, {
      headers: { 'User-Agent': YAHOO_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const body = (await res.json()) as YahooSearchResponse
    const quotes = body.quotes ?? []

    const seen = new Set<string>()
    const results: ForeignSecurityResult[] = []
    for (const q of quotes) {
      const symbol = q.symbol
      if (!symbol || !YAHOO_QUOTE_TYPES.has(q.quoteType ?? '')) continue
      if (seen.has(symbol)) continue
      seen.add(symbol)
      const assetType: 'equity' | 'bond' | null =
        q.quoteType === 'EQUITY' || q.quoteType === 'ETF' ? 'equity' : null
      results.push({
        ticker: symbol,
        shortName: q.shortname ?? q.longname ?? symbol,
        fullName: q.longname ?? q.shortname ?? symbol,
        isin: null,
        assetType,
        currency: 'USD',
        exchange: q.exchange ?? 'NASDAQ',
        isTraded: true,
      })
      if (results.length >= 10) break
    }
    return results
  } catch {
    return []
  }
}
