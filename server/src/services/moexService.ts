interface MoexMarketData {
  marketdata: {
    columns: string[]
    data: unknown[][]
  }
}

interface MoexSecurities {
  securities: {
    columns: string[]
    data: unknown[][]
  }
}

const PREFERRED_BOARDS: Record<'equity' | 'bond', string[]> = {
  equity: ['TQBR', 'SPBX'],
  bond: ['TQOB', 'TQCB', 'TQIR', 'TQRD'],
}

async function fetchMarketData(engine: string, market: string, ticker: string, columns: string): Promise<MoexMarketData['marketdata'] | null> {
  const url = `https://iss.moex.com/iss/engines/${engine}/markets/${market}/securities/${encodeURIComponent(ticker)}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=${columns}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'InvestAnalitic/1.0' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return null
  const body = (await res.json()) as MoexMarketData
  return body.marketdata ?? null
}

function pickPrice(data: MoexMarketData['marketdata'], fields: string[], preferredBoards: string[] = []): number | null {
  const iBoard = data.columns.indexOf('BOARDID')
  const rows = preferredBoards.length
    ? [...data.data].sort((a, b) => {
        const ra = preferredBoards.indexOf(String(a[iBoard]))
        const rb = preferredBoards.indexOf(String(b[iBoard]))
        return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb)
      })
    : data.data

  for (const row of rows) {
    for (const field of fields) {
      const i = data.columns.indexOf(field)
      if (i === -1) continue
      const v = row[i]
      if (typeof v === 'number' && v > 0) return v
    }
  }
  return null
}

/** Цена закрытия предыдущей торговой сессии (фоллбэк для тонко торгуемых ОТС-бумаг). */
async function fetchOtcPrevClose(ticker: string): Promise<number | null> {
  const url = `https://iss.moex.com/iss/engines/otc/markets/shares/securities/${encodeURIComponent(ticker)}.json?iss.meta=off&iss.only=securities&securities.columns=BOARDID,PREVPRICE`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'InvestAnalitic/1.0' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return null
  const body = (await res.json()) as MoexSecurities
  const cols = body.securities?.columns ?? []
  const rows = body.securities?.data ?? []
  const iPrev = cols.indexOf('PREVPRICE')
  if (iPrev === -1) return null
  for (const row of rows) {
    const v = row[iPrev]
    if (typeof v === 'number' && v > 0) return v
  }
  return null
}

/**
 * Текущая цена бумаги с MOEX. Для облигаций — в % от номинала (как и average_price).
 * Сначала проверяется основной рынок (stock), для акций дополнительно — рынок
 * иностранных бумаг ОТС (тикеры с суффиксом "-RM" и т.п.).
 */
export async function fetchMoexPrice(ticker: string, assetType: 'equity' | 'bond'): Promise<number | null> {
  const market = assetType === 'bond' ? 'bonds' : 'shares'

  try {
    const stockData = await fetchMarketData('stock', market, ticker, 'BOARDID,LAST,CLOSE')
    if (stockData) {
      const price = pickPrice(stockData, ['LAST', 'CLOSE'], PREFERRED_BOARDS[assetType])
      if (price != null) return price
    }
  } catch {
    // основной рынок недоступен — пробуем ОТС ниже (для акций)
  }

  if (assetType !== 'equity') return null

  try {
    const otcData = await fetchMarketData('otc', 'shares', ticker, 'BOARDID,LAST,CLOSEPRICE,WAPRICE')
    if (otcData) {
      const price = pickPrice(otcData, ['LAST', 'CLOSEPRICE', 'WAPRICE'])
      if (price != null) return price
    }
    return await fetchOtcPrevClose(ticker)
  } catch {
    return null
  }
}
