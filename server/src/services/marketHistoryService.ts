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

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function fetchHistoryFromEngine(engine: string, market: string, ticker: string): Promise<number[]> {
  const till = new Date()
  const from = new Date(till.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000)
  const url = `https://iss.moex.com/iss/history/engines/${engine}/markets/${market}/securities/${encodeURIComponent(ticker)}.json` +
    `?iss.meta=off&history.columns=TRADEDATE,CLOSE&from=${fmtDate(from)}&till=${fmtDate(till)}`

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

  return rows
    .map((row) => row[iClose])
    .filter((v): v is number => typeof v === 'number' && v > 0)
}

/**
 * Источники истории цен в порядке проверки. Для акций дополнительно проверяется
 * рынок ОТС (иностранные бумаги с суффиксом "-RM" и т.п.), у которых нет истории
 * на основном рынке.
 */
const SOURCES: Record<'equity' | 'bond', { engine: string; market: string }[]> = {
  equity: [
    { engine: 'stock', market: 'shares' },
    { engine: 'otc', market: 'shares' },
  ],
  bond: [{ engine: 'stock', market: 'bonds' }],
}

/** Дневные цены закрытия за последние ~30 дней (для графика динамики). Кэш на час. */
export async function fetchPriceHistory(ticker: string, assetType: 'equity' | 'bond'): Promise<number[]> {
  const key = `${assetType}:${ticker}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.prices

  for (const { engine, market } of SOURCES[assetType]) {
    try {
      const prices = await fetchHistoryFromEngine(engine, market, ticker)
      if (prices.length > 0) {
        cache.set(key, { prices, fetchedAt: Date.now() })
        return prices
      }
    } catch {
      // пробуем следующий источник
    }
  }

  cache.set(key, { prices: [], fetchedAt: Date.now() })
  return []
}
