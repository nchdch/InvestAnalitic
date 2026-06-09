interface MoexMarketData {
  marketdata: {
    columns: string[]
    data: unknown[][]
  }
}

const PREFERRED_BOARDS: Record<'equity' | 'bond', string[]> = {
  equity: ['TQBR', 'SPBX'],
  bond: ['TQOB', 'TQCB', 'TQIR', 'TQRD'],
}

/** Текущая цена бумаги с MOEX. Для облигаций — в % от номинала (как и average_price). */
export async function fetchMoexPrice(ticker: string, assetType: 'equity' | 'bond'): Promise<number | null> {
  const market = assetType === 'bond' ? 'bonds' : 'shares'
  const url = `https://iss.moex.com/iss/engines/stock/markets/${market}/securities/${encodeURIComponent(ticker)}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=BOARDID,LAST,CLOSE`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'InvestAnalitic/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null

    const body = (await res.json()) as MoexMarketData
    const cols = body.marketdata?.columns ?? []
    const rows = body.marketdata?.data ?? []
    const iBoard = cols.indexOf('BOARDID')
    const iLast = cols.indexOf('LAST')
    const iClose = cols.indexOf('CLOSE')
    if (iLast === -1 && iClose === -1) return null

    const preferred = PREFERRED_BOARDS[assetType]
    const sorted = [...rows].sort((a, b) => {
      const ra = preferred.indexOf(String(a[iBoard]))
      const rb = preferred.indexOf(String(b[iBoard]))
      return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb)
    })

    for (const row of sorted) {
      const last = row[iLast]
      if (typeof last === 'number' && last > 0) return last
      const close = row[iClose]
      if (typeof close === 'number' && close > 0) return close
    }
    return null
  } catch {
    return null
  }
}
