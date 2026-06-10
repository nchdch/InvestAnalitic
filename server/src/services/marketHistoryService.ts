interface HistoryResponse {
  history: {
    columns: string[]
    data: unknown[][]
  }
}

interface HistoryPoint {
  date: string
  close: number
}

interface CacheEntry {
  points: HistoryPoint[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000
const DEFAULT_DAYS = 30
const MAX_DAYS = 400
const PAGE_SIZE = 100
const MAX_PAGES = 6

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function fetchHistoryPage(
  engine: string, market: string, ticker: string, from: string, till: string, start: number,
): Promise<HistoryPoint[]> {
  const url = `https://iss.moex.com/iss/history/engines/${engine}/markets/${market}/securities/${encodeURIComponent(ticker)}.json` +
    `?iss.meta=off&history.columns=TRADEDATE,CLOSE&from=${from}&till=${till}&start=${start}`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'InvestAnalitic/1.0' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return []

  const body = (await res.json()) as HistoryResponse
  const cols = body.history?.columns ?? []
  const rows = body.history?.data ?? []
  const iDate = cols.indexOf('TRADEDATE')
  const iClose = cols.indexOf('CLOSE')
  if (iDate === -1 || iClose === -1) return []

  return rows
    .map((row) => ({ date: String(row[iDate]), close: row[iClose] }))
    .filter((p): p is HistoryPoint => typeof p.close === 'number' && p.close > 0)
}

async function fetchHistoryFromEngine(engine: string, market: string, ticker: string, days: number): Promise<HistoryPoint[]> {
  const till = new Date()
  const from = new Date(till.getTime() - days * 24 * 60 * 60 * 1000)
  const fromStr = fmtDate(from)
  const tillStr = fmtDate(till)

  const points: HistoryPoint[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await fetchHistoryPage(engine, market, ticker, fromStr, tillStr, page * PAGE_SIZE)
    if (batch.length === 0) break
    points.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return points
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
    { engine: 'otc', market: 'sharesndm' },
  ],
  bond: [{ engine: 'stock', market: 'bonds' }],
}

/** Дневные цены закрытия за указанный период (по умолчанию 30 дней, максимум 400). Кэш на час. */
export async function fetchPriceHistory(
  ticker: string, assetType: 'equity' | 'bond', days: number = DEFAULT_DAYS,
): Promise<{ dates: string[]; prices: number[] }> {
  const clampedDays = Math.min(Math.max(Math.floor(days), 1), MAX_DAYS)
  const key = `${assetType}:${ticker}:${clampedDays}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { dates: cached.points.map((p) => p.date), prices: cached.points.map((p) => p.close) }
  }

  for (const { engine, market } of SOURCES[assetType]) {
    try {
      const points = await fetchHistoryFromEngine(engine, market, ticker, clampedDays)
      if (points.length > 0) {
        cache.set(key, { points, fetchedAt: Date.now() })
        return { dates: points.map((p) => p.date), prices: points.map((p) => p.close) }
      }
    } catch {
      // пробуем следующий источник
    }
  }

  cache.set(key, { points: [], fetchedAt: Date.now() })
  return { dates: [], prices: [] }
}
