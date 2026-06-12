import { pool } from '../db/pool.js'
import { updatePosition } from './positionService.js'
import { fetchMoexPrice, fetchMoexBondReference } from './moexService.js'
import { fetchForeignPrice } from './foreignMarketService.js'
import { listCashBalances } from './cashService.js'
import { fetchRubRate } from './fxService.js'

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
  exchange_rate: string | null
  last_price: string | null
  prev_day_price: string | null
  face_value: string | null
  coupon_rate: string | null
  coupon_dates: string[] | null
  maturity_date: string | null
  accrued_interest: string | null
  lot_size: string | null
  next_coupon_date: string | null
  next_coupon_value: string | null
  current_accrued_interest: string | null
  initial_face_value: string | null
  amortization: { date: string; valuePrc: number; value: number }[] | null
  offer_date: string | null
  bond_info_updated_at: string | null
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

export async function getPortfolioSummary(accountIds: string[]) {
  let accounts: DbAccount[] = []
  if (accountIds.length > 0) {
    const result = await pool.query<DbAccount>(
      'SELECT id, name, broker FROM accounts WHERE id = ANY($1) ORDER BY created_at',
      [accountIds]
    )
    accounts = result.rows
  }

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

  // Денежные остатки по счетам
  const cashBalances = await listCashBalances(accounts.map((a) => a.id))
  const cashByAccount = new Map<string, typeof cashBalances>()
  for (const c of cashBalances) {
    const list = cashByAccount.get(c.accountId) ?? []
    list.push(c)
    cashByAccount.set(c.accountId, list)
  }

  // Сумма полученных купонов по облигационным позициям (account_id + ticker)
  const { rows: couponPayments } = await pool.query<{ account_id: string; ticker: string; total: string }>(
    `SELECT account_id, ticker, COALESCE(SUM(net_amount), 0) AS total
     FROM payments
     WHERE type = 'coupon' AND account_id = ANY($1)
     GROUP BY account_id, ticker`,
    [accounts.map((a) => a.id)]
  )
  const couponIncomeMap = new Map<string, number>()
  for (const r of couponPayments) {
    couponIncomeMap.set(`${r.account_id}|${r.ticker}`, Number(r.total))
  }

  // Курсы валют для приведения остатков к рублю
  const cashCurrencies = [...new Set(cashBalances.map((c) => c.currency).filter((c) => c !== 'RUB'))]
  const rubRates = new Map<string, number>()
  for (const cur of cashCurrencies) {
    try {
      const r = await fetchRubRate(cur)
      rubRates.set(cur, r?.rate ?? 1)
    } catch (err) {
      console.error(`fx rate error for ${cur}:`, err)
      rubRates.set(cur, 1)
    }
  }

  let totalValue = 0
  let totalEquityValue = 0
  let totalBondValue = 0
  let totalCashValue = 0
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
      const fxRate = p.exchange_rate != null ? Number(p.exchange_rate) : 1

      const prevDayPrice = p.prev_day_price != null ? Number(p.prev_day_price) : null

      if (p.asset_type === 'equity') {
        const value = qty * lastPrice * fxRate
        const cost = qty * avgPrice * fxRate
        const pnl = value - cost
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
        const dayChange = prevDayPrice != null ? Math.round((lastPrice - prevDayPrice) * qty * fxRate * 100) / 100 : null
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
        const value = qty * (lastPrice / 100) * faceValue * fxRate
        const cost = qty * (avgPrice / 100) * faceValue * fxRate
        const pnl = value - cost
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
        const prevDayValue = prevDayPrice != null ? qty * (prevDayPrice / 100) * faceValue * fxRate : null
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

        const currentYield = lastPrice > 0 ? Math.round((couponRate / (lastPrice / 100)) * 100) / 100 : null
        const couponIncome = couponIncomeMap.get(`${p.account_id}|${p.ticker}`) ?? 0
        const totalPnl = pnl + couponIncome
        const totalPnlPercent = cost > 0 ? Math.round((totalPnl / cost) * 10000) / 100 : 0

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
            lotSize: p.lot_size != null ? Number(p.lot_size) : undefined,
            nextCouponDate: p.next_coupon_date ?? undefined,
            nextCouponValue: p.next_coupon_value != null ? Number(p.next_coupon_value) : undefined,
            currentAccruedInterest: p.current_accrued_interest != null ? Number(p.current_accrued_interest) : undefined,
            initialFaceValue: p.initial_face_value != null ? Number(p.initial_face_value) : undefined,
            amortization: p.amortization ?? undefined,
            offerDate: p.offer_date ?? undefined,
            bondInfoUpdatedAt: p.bond_info_updated_at ?? undefined,
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
          currentYield,
          couponIncome: Math.round(couponIncome * 100) / 100,
          totalPnl: Math.round(totalPnl * 100) / 100,
          totalPnlPercent,
          portfolioWeight: 0,
        })
      }
    }

    // Денежные остатки счёта, приведённые к рублю
    const cashRows = (cashByAccount.get(acc.id) ?? []).map((c) => {
      const rubRate = c.currency === 'RUB' ? 1 : (rubRates.get(c.currency) ?? 1)
      const rubEquivalent = Math.round(c.amount * rubRate * 100) / 100
      return {
        balance: { accountId: c.accountId, currency: c.currency, amount: c.amount },
        rate: rubRate,
        rubEquivalent,
        accountWeight: 0,
        portfolioWeight: 0,
      }
    })
    const accCashValue = cashRows.reduce((sum, r) => sum + r.rubEquivalent, 0)
    const accTotalValue = accValue + accCashValue

    totalValue += accTotalValue
    totalCashValue += accCashValue
    totalUnrealizedPnl += accPnl

    const accPnlPct = accCost > 0 ? Math.round((accPnl / accCost) * 10000) / 100 : 0

    return {
      id: acc.id,
      name: acc.name,
      broker: acc.broker,
      totalValue: Math.round(accTotalValue * 100) / 100,
      investedValue: Math.round(accCost * 100) / 100,
      unrealizedPnl: Math.round(accPnl * 100) / 100,
      unrealizedPnlPercent: accPnlPct,
      dayChange: Math.round(accDayChange * 100) / 100,
      portfolioWeight: 0,
      equityRows,
      bondRows,
      cashRows,
    }
  })

  // Второй проход: проставляем веса
  for (const acc of accountSummaries) {
    acc.portfolioWeight = totalValue > 0 ? Math.round((acc.totalValue / totalValue) * 10000) / 100 : 0
    for (const row of [...acc.equityRows, ...acc.bondRows]) {
      row.portfolioWeight = totalValue > 0 ? Math.round((row.currentValue / totalValue) * 10000) / 100 : 0
    }
    for (const row of acc.cashRows) {
      row.accountWeight = acc.totalValue > 0 ? Math.round((row.rubEquivalent / acc.totalValue) * 10000) / 100 : 0
      row.portfolioWeight = totalValue > 0 ? Math.round((row.rubEquivalent / totalValue) * 10000) / 100 : 0
    }
  }

  const unrealizedPnlPercent = totalCost > 0
    ? Math.round((totalUnrealizedPnl / totalCost) * 10000) / 100
    : 0

  const equityWeight = totalValue > 0 ? Math.round((totalEquityValue / totalValue) * 10000) / 100 : 0
  const bondWeight = totalValue > 0 ? Math.round((totalBondValue / totalValue) * 10000) / 100 : 0
  const cashWeight = totalValue > 0 ? Math.round((totalCashValue / totalValue) * 10000) / 100 : 0

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    investedValue: Math.round(totalCost * 100) / 100,
    dayChange: Math.round(totalDayChange * 100) / 100,
    equityValue: Math.round(totalEquityValue * 100) / 100,
    bondValue: Math.round(totalBondValue * 100) / 100,
    cashValue: Math.round(totalCashValue * 100) / 100,
    equityWeight,
    bondWeight,
    cashWeight,
    unrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
    unrealizedPnlPercent,
    forwardDividendYield: null,
    baseCurrency: 'RUB',
    accounts: accountSummaries,
  }
}

/** Подтягивает текущие котировки с MOEX (для российских бумаг) и Finnhub (для иностранных акций) и обновляет last_price у позиций портфеля. */
export async function refreshPrices(accountIds: string[]) {
  if (accountIds.length === 0) return { updated: 0, failed: 0, total: 0 }

  const { rows: positions } = await pool.query<{ id: string; ticker: string; asset_type: string; exchange: string }>(
    `SELECT id, ticker, asset_type, exchange FROM positions WHERE account_id = ANY($1) AND quantity > 0`,
    [accountIds]
  )

  let updated = 0
  let failed = 0

  for (const p of positions) {
    if (p.asset_type !== 'equity' && p.asset_type !== 'bond') {
      failed++
      continue
    }

    let price = p.exchange === 'MOEX'
      ? await fetchMoexPrice(p.ticker, p.asset_type)
      : p.asset_type === 'equity' ? await fetchForeignPrice(p.ticker) : null

    // MOEX не знает иностранный тикер (например, NVDA, UBER) — пробуем Finnhub как запасной источник
    if (price == null && p.asset_type === 'equity' && p.exchange === 'MOEX') {
      price = await fetchForeignPrice(p.ticker)
    }

    if (price == null) {
      failed++
      continue
    }
    await updatePosition(p.id, { lastPrice: price })
    updated++

    if (p.asset_type === 'bond' && p.exchange === 'MOEX') {
      try {
        const ref = await fetchMoexBondReference(p.ticker)
        if (ref) {
          await updatePosition(p.id, {
            faceValue: ref.faceValue ?? undefined,
            couponRate: ref.couponRate ?? undefined,
            couponDates: ref.couponDates,
            maturityDate: ref.maturityDate ?? undefined,
            lotSize: ref.lotSize ?? undefined,
            nextCouponDate: ref.nextCouponDate,
            nextCouponValue: ref.nextCouponValue,
            currentAccruedInterest: ref.accruedInterest,
            initialFaceValue: ref.initialFaceValue,
            amortization: ref.amortization.length > 0 ? ref.amortization : null,
            offerDate: ref.offerDate,
            bondInfoUpdatedAt: new Date(),
          })
        }
      } catch (err) {
        console.error(`bond reference refresh error for ${p.ticker}:`, err)
      }
    }
  }

  return { updated, failed, total: positions.length }
}
