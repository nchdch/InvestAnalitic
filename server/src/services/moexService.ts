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

interface MoexBondization {
  coupons?: { columns: string[]; data: unknown[][] }
  amortizations?: { columns: string[]; data: unknown[][] }
}

export interface MoexBondAmortization {
  date: string
  valuePrc: number
  value: number
}

export interface MoexBondReference {
  lotSize: number | null
  faceValue: number | null
  initialFaceValue: number | null
  couponRate: number | null
  couponPeriodDays: number | null
  nextCouponDate: string | null
  nextCouponValue: number | null
  accruedInterest: number | null
  maturityDate: string | null
  offerDate: string | null
  couponDates: string[]
  amortization: MoexBondAmortization[]
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

/** Цена закрытия предыдущей торговой сессии (фоллбэк, если LAST/CLOSE сейчас не торгуются). */
async function fetchPrevPrice(engine: string, market: string, ticker: string): Promise<number | null> {
  const url = `https://iss.moex.com/iss/engines/${engine}/markets/${market}/securities/${encodeURIComponent(ticker)}.json?iss.meta=off&iss.only=securities&securities.columns=BOARDID,PREVPRICE`
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
 * Источники проверяются по очереди:
 * 1. Основной рынок (stock) — LAST/CLOSE, затем PREVPRICE (если бумага сегодня не торговалась)
 * 2. Для акций дополнительно — рынок иностранных бумаг ОТС (тикеры "-RM" и т.п.)
 * 3. Для акций дополнительно — рынок адресных ОТС-сделок (sharesndm)
 */
export async function fetchMoexPrice(ticker: string, assetType: 'equity' | 'bond'): Promise<number | null> {
  const market = assetType === 'bond' ? 'bonds' : 'shares'

  try {
    const stockData = await fetchMarketData('stock', market, ticker, 'BOARDID,LAST,CLOSE')
    if (stockData) {
      const price = pickPrice(stockData, ['LAST', 'CLOSE'], PREFERRED_BOARDS[assetType])
      if (price != null) return price
    }
    const prevPrice = await fetchPrevPrice('stock', market, ticker)
    if (prevPrice != null) return prevPrice
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
    const prevPrice = await fetchPrevPrice('otc', 'shares', ticker)
    if (prevPrice != null) return prevPrice
  } catch {
    // переходим к следующему рынку
  }

  try {
    const ndmData = await fetchMarketData('otc', 'sharesndm', ticker, 'BOARDID,LAST')
    if (ndmData) {
      const price = pickPrice(ndmData, ['LAST'])
      if (price != null) return price
    }
  } catch {
    return null
  }

  return null
}

/**
 * Справочные данные облигации с MOEX: номинал, лот, ставка и дата ближайшего купона,
 * НКД, дата погашения/оферты, полный график купонов и амортизации.
 */
export async function fetchMoexBondReference(ticker: string): Promise<MoexBondReference | null> {
  try {
    const url = `https://iss.moex.com/iss/engines/stock/markets/bonds/securities/${encodeURIComponent(ticker)}.json?iss.meta=off&iss.only=securities`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'InvestAnalitic/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null

    const body = (await res.json()) as MoexSecurities
    const cols = body.securities?.columns ?? []
    const rows = body.securities?.data ?? []
    if (rows.length === 0) return null
    const row = rows[0]

    const idx = (name: string) => cols.indexOf(name)
    const num = (name: string): number | null => {
      const i = idx(name)
      if (i === -1) return null
      const v = row[i]
      return typeof v === 'number' ? v : null
    }
    const str = (name: string): string | null => {
      const i = idx(name)
      if (i === -1) return null
      const v = row[i]
      if (v == null || v === '' || v === '0000-00-00') return null
      return String(v)
    }

    const lotSize = num('LOTSIZE')
    const faceValue = num('FACEVALUE')
    const initialFaceValue = num('FACEVALUEONSETTLEDATE') ?? faceValue
    const couponRate = num('COUPONPERCENT')
    const couponPeriodDays = num('COUPONPERIOD')
    const nextCouponDate = str('NEXTCOUPON')
    const nextCouponValue = num('COUPONVALUE')
    const accruedInterest = num('ACCRUEDINT')
    const maturityDate = str('MATDATE')
    const offerDate = str('OFFERDATE') ?? str('CALLOPTIONDATE') ?? str('PUTOPTIONDATE')

    let couponDates: string[] = []
    let amortization: MoexBondAmortization[] = []

    try {
      const bzUrl = `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}/bondization.json?iss.meta=off&iss.only=coupons,amortizations&limit=unlimited`
      const bzRes = await fetch(bzUrl, {
        headers: { 'User-Agent': 'InvestAnalitic/1.0' },
        signal: AbortSignal.timeout(5000),
      })
      if (bzRes.ok) {
        const bzBody = (await bzRes.json()) as MoexBondization
        const today = new Date().toISOString().slice(0, 10)

        if (bzBody.coupons) {
          const iDate = bzBody.coupons.columns.indexOf('coupondate')
          if (iDate !== -1) {
            couponDates = bzBody.coupons.data
              .map((r) => String(r[iDate] ?? ''))
              .filter((d) => d && d !== '0000-00-00')
              .sort()
          }
        }

        if (bzBody.amortizations) {
          const iDate = bzBody.amortizations.columns.indexOf('amortdate')
          const iValuePrc = bzBody.amortizations.columns.indexOf('valueprc')
          const iValue = bzBody.amortizations.columns.indexOf('value')
          if (iDate !== -1) {
            amortization = bzBody.amortizations.data
              .map((r) => ({
                date: String(r[iDate] ?? ''),
                valuePrc: iValuePrc !== -1 ? Number(r[iValuePrc] ?? 0) : 0,
                value: iValue !== -1 ? Number(r[iValue] ?? 0) : 0,
              }))
              .filter((a) => a.date && a.date !== '0000-00-00' && a.date >= today)
              .sort((x, y) => x.date.localeCompare(y.date))
          }
        }
      }
    } catch {
      // график выплат недоступен — используем то, что уже есть из основного справочника
    }

    if (couponDates.length === 0 && nextCouponDate) couponDates = [nextCouponDate]

    return {
      lotSize,
      faceValue,
      initialFaceValue,
      couponRate,
      couponPeriodDays,
      nextCouponDate,
      nextCouponValue,
      accruedInterest,
      maturityDate,
      offerDate,
      couponDates,
      amortization,
    }
  } catch {
    return null
  }
}
