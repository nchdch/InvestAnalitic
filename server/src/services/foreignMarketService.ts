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

/** Поиск иностранных акций и ETF (NASDAQ/NYSE) через Finnhub. */
export async function searchForeignSecurities(q: string): Promise<ForeignSecurityResult[]> {
  const key = apiKey()
  if (!key) return []

  try {
    const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(q)}&token=${key}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const body = (await res.json()) as FinnhubSearchResponse
    const results = body.result ?? []

    return results
      .filter((item) => item.symbol && !item.symbol.includes('.') && FOREIGN_TYPES.has(item.type ?? ''))
      .map((item): ForeignSecurityResult => ({
        ticker: item.symbol as string,
        shortName: item.description ?? (item.symbol as string),
        fullName: item.description ?? (item.symbol as string),
        isin: null,
        assetType: 'equity',
        currency: 'USD',
        exchange: 'NASDAQ',
        isTraded: true,
      }))
      .slice(0, 8)
  } catch {
    return []
  }
}
