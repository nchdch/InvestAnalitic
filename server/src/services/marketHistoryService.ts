interface HistoryResponse {
  history: {
    columns: string[]
    data: unknown[][]
  }
}

interface CacheEntry {
  prices: number[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000
const HISTORY_DAYS = 30

const MARKET: Record<'equity' | 'bond', string> = {
  equity: 'shares',
  bond: 'bonds',
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Дневные цены закрытия за последние ~30 дней (для графика динамики). Кэш на час. */
export async function fetchPriceHistory(ticker: string, assetType: 'equity' | 'bond'): Promise<number[]> {
  const key = `${assetType}:${ticker}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.prices

  const till = new Date()
  const from = new Date(till.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000)
  const market = MARKET[assetType]
  const url = `https://iss.moex.com/iss/history/engines/stock/markets/${market}/securities/${encodeURIComponent(ticker)}.json` +
    `?iss.meta=off&history.columns=TRADEDATE,CLOSE&from=${fmtDate(from)}&till=${fmtDate(till)}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'InvestAnalitic/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []

    const body = (await res.json()) as HistoryResponse
    const cols = body.history?.columns ?? []
    const rows = body.history?.data ?? []
    const iClose = cols.indexOf('CLOSE')
    if (iClose === -1) return []

    const prices = rows
      .map((row) => row[iClose])
      .filter((v): v is number => typeof v === 'number' && v > 0)

    cache.set(key, { prices, fetchedAt: Date.now() })
    return prices
  } catch {
    return []
  }
}
