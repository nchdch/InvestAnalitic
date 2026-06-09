import { pool } from '../db/pool.js'

interface DbPosition {
  id: string
  account_id: string
  ticker: string
  name: string | null
  exchange: string
  asset_type: string
  currency: string
  quantity: string
  average_price: string
  averaging_method: string
  last_price: string | null
  prev_day_price: string | null
  face_value: string | null
  coupon_rate: string | null
  coupon_dates: string[] | null
  maturity_date: string | null
  accrued_interest: string | null
}

interface DbAccount {
  id: string
  name: string
  broker: string
}

function calcYtm(
  currentPricePct: number,
  couponRate: number,
  faceValue: number,
  maturityDate: string,
): number | null {
  try {
    const today = new Date()
    const maturity = new Date(maturityDate)
    const yearsLeft = (maturity.getTime() - today.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (yearsLeft <= 0) return null
    const currentPrice = (currentPricePct / 100) * faceValue
    const couponAbs = (couponRate / 100) * faceValue
    // Формула Брэди (приближение YTM)
    const ytm = (couponAbs + (faceValue - currentPrice) / yearsLeft) / ((faceValue + currentPrice) / 2)
    return Math.round(ytm * 10000) / 100  // в % с двумя знаками
  } catch {
    return null
  }
}

function daysTo(dateStr: string): number | null {
  try {
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.max(0, Math.round(diff / (24 * 3600 * 1000)))
  } catch {
    return null
  }
}

export async function getPortfolioSummary(orgId?: string) {
  const { rows: accounts } = orgId
    ? await pool.query<DbAccount>(
        'SELECT id, name, broker FROM accounts WHERE org_id = $1 ORDER BY created_at',
        [orgId]
      )
    : await pool.query<DbAccount>('SELECT id, name, broker FROM accounts ORDER BY created_at')

  if (accounts.length === 0) {
    return {
      totalValue: 0,
      equityValue: 0,
      bondValue: 0,
      cashValue: 0,
      equityWeight: 0,
      bondWeight: 0,
      cashWeight: 0,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      forwardDividendYield: null,
      baseCurrency: 'RUB',
      accounts: [],
    }
  }

  const { rows: positions } = await pool.query<DbPosition>(
    'SELECT * FROM positions ORDER BY account_id, created_at'
  )

  // Группируем позиции по счёту
  const byAccount = new Map<string, DbPosition[]>()
  for (const p of positions) {
    const list = byAccount.get(p.account_id) ?? []
    list.push(p)
    byAccount.set(p.account_id, list)
  }

  let totalValue = 0
  let totalEquityValue = 0
  let totalBondValue = 0
  let totalCost = 0
  let totalUnrealizedPnl = 0
  let totalDayChange = 0

  const accountSummaries = accounts.map((acc) => {
    const accPositions = byAccount.get(acc.id) ?? []
    const equityRows = []
    const bondRows = []
    let accValue = 0
    let accPnl = 0
    let accCost = 0
    let accDayChange = 0

    for (const p of accPositions) {
      const qty = Number(p.quantity)
      if (qty === 0) continue

      const avgPrice = Number(p.average_price)
      const lastPrice = p.last_price != null ? Number(p.last_price) : avgPrice

      const prevDayPrice = p.prev_day_price != null ? Number(p.prev_day_price) : null

      if (p.asset_type === 'equity') {
        const value = qty * lastPrice
        const cost = qty * avgPrice
        const pnl = value - cost
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
        const dayChange = prevDayPrice != null ? Math.round((lastPrice - prevDayPrice) * qty * 100) / 100 : null
        const dayChangePct = prevDayPrice != null && prevDayPrice !== 0
          ? Math.round(((lastPrice - prevDayPrice) / prevDayPrice) * 10000) / 100
          : null
        accValue += value
        accPnl += pnl
        accCost += cost
        accDayChange += dayChange ?? 0
        totalEquityValue += value
        totalCost += cost
        totalDayChange += dayChange ?? 0

        equityRows.push({
          position: {
            id: p.id,
            accountId: p.account_id,
            ticker: p.ticker,
            name: p.name ?? p.ticker,
            exchange: p.exchange,
            currency: p.currency,
            quantity: qty,
            averagePrice: avgPrice,
            averagingMethod: p.averaging_method,
            assetType: 'equity' as const,
          },
          currentPrice: lastPrice,
          currentValue: value,
          investedValue: cost,
          unrealizedPnl: pnl,
          unrealizedPnlPercent: Math.round(pnlPct * 100) / 100,
          dayChange,
          dayChangePercent: dayChangePct,
          portfolioWeight: 0,
        })
      } else if (p.asset_type === 'bond') {
        const faceValue = p.face_value != null ? Number(p.face_value) : 1000
        const value = qty * (lastPrice / 100) * faceValue
        const cost = qty * (avgPrice / 100) * faceValue
        const pnl = value - cost
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
        const prevDayValue = prevDayPrice != null ? qty * (prevDayPrice / 100) * faceValue : null
        const dayChange = prevDayValue != null ? Math.round((value - prevDayValue) * 100) / 100 : null
        const dayChangePct = prevDayPrice != null && prevDayPrice !== 0
          ? Math.round(((lastPrice - prevDayPrice) / prevDayPrice) * 10000) / 100
          : null
        accValue += value
        accPnl += pnl
        accCost += cost
        accDayChange += dayChange ?? 0
        totalBondValue += value
        totalCost += cost
        totalDayChange += dayChange ?? 0

        const couponRate = p.coupon_rate != null ? Number(p.coupon_rate) : 0
        const ytm = p.maturity_date
          ? calcYtm(lastPrice, couponRate, faceValue, p.maturity_date)
          : null
        const days = p.maturity_date ? daysTo(p.maturity_date) : null

        bondRows.push({
          position: {
            id: p.id,
            accountId: p.account_id,
            ticker: p.ticker,
            name: p.name ?? p.ticker,
            exchange: p.exchange,
            currency: p.currency,
            quantity: qty,
            averagePrice: avgPrice,
            averagingMethod: p.averaging_method,
            assetType: 'bond' as const,
            faceValue,
            couponRate,
            couponDates: p.coupon_dates ?? [],
            maturityDate: p.maturity_date ?? '',
            accruedInterest: p.accrued_interest != null ? Number(p.accrued_interest) : 0,
          },
          currentPrice: lastPrice,
          currentValue: value,
          investedValue: cost,
          ytm,
          daysToMaturity: days,
          unrealizedPnl: pnl,
          unrealizedPnlPercent: Math.round(pnlPct * 100) / 100,
          dayChange,
          dayChangePercent: dayChangePct,
          portfolioWeight: 0,
        })
      }
    }

    totalValue += accValue
    totalUnrealizedPnl += accPnl

    const accPnlPct = accCost > 0 ? Math.round((accPnl / accCost) * 10000) / 100 : 0

    return {
      id: acc.id,
      name: acc.name,
      broker: acc.broker,
      totalValue: accValue,
      investedValue: Math.round(accCost * 100) / 100,
      unrealizedPnl: Math.round(accPnl * 100) / 100,
      unrealizedPnlPercent: accPnlPct,
      dayChange: Math.round(accDayChange * 100) / 100,
      portfolioWeight: 0,
      equityRows,
      bondRows,
      cashRows: [] as unknown[],
    }
  })

  // Второй проход: проставляем веса
  for (const acc of accountSummaries) {
    acc.portfolioWeight = totalValue > 0 ? Math.round((acc.totalValue / totalValue) * 10000) / 100 : 0
    for (const row of [...acc.equityRows, ...acc.bondRows]) {
      row.portfolioWeight = totalValue > 0 ? Math.round((row.currentValue / totalValue) * 10000) / 100 : 0
    }
  }

  const unrealizedPnlPercent = totalCost > 0
    ? Math.round((totalUnrealizedPnl / totalCost) * 10000) / 100
    : 0

  const equityWeight = totalValue > 0 ? Math.round((totalEquityValue / totalValue) * 10000) / 100 : 0
  const bondWeight = totalValue > 0 ? Math.round((totalBondValue / totalValue) * 10000) / 100 : 0

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    investedValue: Math.round(totalCost * 100) / 100,
    dayChange: Math.round(totalDayChange * 100) / 100,
    equityValue: Math.round(totalEquityValue * 100) / 100,
    bondValue: Math.round(totalBondValue * 100) / 100,
    cashValue: 0,
    equityWeight,
    bondWeight,
    cashWeight: Math.round((100 - equityWeight - bondWeight) * 100) / 100,
    unrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
    unrealizedPnlPercent,
    forwardDividendYield: null,
    baseCurrency: 'RUB',
    accounts: accountSummaries,
  }
}
