import { pool } from '../db/pool.js'

function toRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    accountId: r.account_id,
    ticker: r.ticker,
    isin: r.isin ?? undefined,
    name: r.name ?? undefined,
    exchange: r.exchange,
    assetType: r.asset_type,
    currency: r.currency,
    quantity: Number(r.quantity),
    averagePrice: Number(r.average_price),
    averagingMethod: r.averaging_method,
    lastPrice: r.last_price != null ? Number(r.last_price) : null,
    lastPriceUpdatedAt: r.last_price_updated_at ?? null,
    prevDayPrice: r.prev_day_price != null ? Number(r.prev_day_price) : null,
    // bond fields
    faceValue: r.face_value != null ? Number(r.face_value) : undefined,
    couponRate: r.coupon_rate != null ? Number(r.coupon_rate) : undefined,
    couponDates: r.coupon_dates ?? undefined,
    maturityDate: r.maturity_date ?? undefined,
    accruedInterest: r.accrued_interest != null ? Number(r.accrued_interest) : undefined,
    // справочные данные облигации с MOEX
    lotSize: r.lot_size != null ? Number(r.lot_size) : undefined,
    nextCouponDate: r.next_coupon_date ?? undefined,
    nextCouponValue: r.next_coupon_value != null ? Number(r.next_coupon_value) : undefined,
    currentAccruedInterest: r.current_accrued_interest != null ? Number(r.current_accrued_interest) : undefined,
    initialFaceValue: r.initial_face_value != null ? Number(r.initial_face_value) : undefined,
    amortization: r.amortization ?? undefined,
    offerDate: r.offer_date ?? undefined,
    bondInfoUpdatedAt: r.bond_info_updated_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function listPositions(accountIds: string[]) {
  if (accountIds.length === 0) return []
  const { rows } = await pool.query(
    'SELECT * FROM positions WHERE account_id = ANY($1) ORDER BY account_id, created_at',
    [accountIds]
  )
  return rows.map(toRow)
}

export async function getPosition(id: string) {
  const { rows } = await pool.query('SELECT * FROM positions WHERE id = $1', [id])
  return rows[0] ? toRow(rows[0]) : null
}

export async function getPositionByTicker(accountId: string, ticker: string) {
  const { rows } = await pool.query(
    'SELECT * FROM positions WHERE account_id = $1 AND ticker = $2',
    [accountId, ticker]
  )
  return rows[0] ? toRow(rows[0]) : null
}

export interface CreatePositionInput {
  accountId: string
  ticker: string
  isin?: string
  name?: string
  exchange: string
  assetType: 'equity' | 'bond'
  currency: string
  quantity: number
  averagePrice: number
  averagingMethod?: string
  exchangeRate?: number
  faceValue?: number
  couponRate?: number
  couponDates?: string[]
  maturityDate?: string
  accruedInterest?: number
  lotSize?: number
  nextCouponDate?: string | null
  nextCouponValue?: number | null
  currentAccruedInterest?: number | null
  initialFaceValue?: number | null
  amortization?: { date: string; valuePrc: number; value: number }[] | null
  offerDate?: string | null
  bondInfoUpdatedAt?: Date
}

export async function createPosition(input: CreatePositionInput) {
  const { rows } = await pool.query(
    `INSERT INTO positions
      (account_id, ticker, isin, name, exchange, asset_type, currency, quantity,
       average_price, averaging_method, exchange_rate, face_value, coupon_rate, coupon_dates,
       maturity_date, accrued_interest)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      input.accountId, input.ticker, input.isin ?? null, input.name ?? null,
      input.exchange, input.assetType, input.currency, input.quantity,
      input.averagePrice, input.averagingMethod ?? 'WAVG',
      input.exchangeRate ?? 1,
      input.faceValue ?? null, input.couponRate ?? null,
      input.couponDates ? JSON.stringify(input.couponDates) : null,
      input.maturityDate ?? null, input.accruedInterest ?? null,
    ]
  )
  return toRow(rows[0])
}

export async function updatePosition(id: string, patch: Partial<CreatePositionInput> & { lastPrice?: number }) {
  const fields: string[] = []
  const vals: unknown[] = []
  let i = 1

  const add = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); vals.push(val) }

  if (patch.accountId !== undefined) add('account_id', patch.accountId)
  if (patch.name !== undefined) add('name', patch.name)
  if (patch.quantity !== undefined) add('quantity', patch.quantity)
  if (patch.averagePrice !== undefined) add('average_price', patch.averagePrice)
  if (patch.lastPrice !== undefined) {
    // Если предыдущая цена обновлялась в другой день — переносим её в prev_day_price
    fields.push(
      `prev_day_price = CASE WHEN last_price IS NOT NULL AND last_price_updated_at::date < CURRENT_DATE THEN last_price ELSE prev_day_price END`
    )
    add('last_price', patch.lastPrice)
    add('last_price_updated_at', new Date())
  }
  if (patch.couponRate !== undefined) add('coupon_rate', patch.couponRate)
  if (patch.maturityDate !== undefined) add('maturity_date', patch.maturityDate)
  if (patch.accruedInterest !== undefined) add('accrued_interest', patch.accruedInterest)
  if (patch.faceValue !== undefined) add('face_value', patch.faceValue)
  if (patch.couponDates !== undefined) add('coupon_dates', JSON.stringify(patch.couponDates))
  if (patch.lotSize !== undefined) add('lot_size', patch.lotSize)
  if (patch.nextCouponDate !== undefined) add('next_coupon_date', patch.nextCouponDate)
  if (patch.nextCouponValue !== undefined) add('next_coupon_value', patch.nextCouponValue)
  if (patch.currentAccruedInterest !== undefined) add('current_accrued_interest', patch.currentAccruedInterest)
  if (patch.initialFaceValue !== undefined) add('initial_face_value', patch.initialFaceValue)
  if (patch.amortization !== undefined) add('amortization', patch.amortization ? JSON.stringify(patch.amortization) : null)
  if (patch.offerDate !== undefined) add('offer_date', patch.offerDate)
  if (patch.bondInfoUpdatedAt !== undefined) add('bond_info_updated_at', patch.bondInfoUpdatedAt)

  if (fields.length === 0) return getPosition(id)

  fields.push(`updated_at = NOW()`)
  vals.push(id)

  const { rows } = await pool.query(
    `UPDATE positions SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  )
  return rows[0] ? toRow(rows[0]) : null
}

export async function deletePosition(id: string) {
  const { rowCount } = await pool.query('DELETE FROM positions WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}

/** Пересчитать среднюю цену методом WAVG после покупки */
export async function applyBuyToPosition(
  client: { query: typeof pool.query },
  accountId: string,
  ticker: string,
  tradeQuantity: number,
  tradePrice: number,
  exchange: string,
  currency: string,
  assetType: 'equity' | 'bond',
  tradeName?: string,
  exchangeRate?: number,
) {
  const { rows } = await client.query(
    'SELECT * FROM positions WHERE account_id = $1 AND ticker = $2 FOR UPDATE',
    [accountId, ticker]
  )

  if (rows.length === 0) {
    await client.query(
      `INSERT INTO positions
        (account_id, ticker, name, exchange, asset_type, currency, quantity, average_price, averaging_method, exchange_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'WAVG', $9)`,
      [accountId, ticker, tradeName ?? ticker, exchange, assetType, currency, tradeQuantity, tradePrice, exchangeRate ?? 1]
    )
  } else {
    const pos = rows[0]
    const oldQty = Number(pos.quantity)
    const oldAvg = Number(pos.average_price)
    const newQty = oldQty + tradeQuantity
    const newAvg = (oldQty * oldAvg + tradeQuantity * tradePrice) / newQty
    await client.query(
      'UPDATE positions SET quantity = $1, average_price = $2, exchange_rate = $3, updated_at = NOW() WHERE id = $4',
      [newQty, newAvg, exchangeRate ?? Number(pos.exchange_rate) ?? 1, pos.id]
    )
  }
}

/** Уменьшить количество при продаже */
export async function applySellToPosition(
  client: { query: typeof pool.query },
  accountId: string,
  ticker: string,
  tradeQuantity: number,
) {
  const { rows } = await client.query(
    'SELECT * FROM positions WHERE account_id = $1 AND ticker = $2 FOR UPDATE',
    [accountId, ticker]
  )
  if (rows.length === 0) throw new Error(`Позиция ${ticker} не найдена на счёте`)

  const pos = rows[0]
  const oldQty = Number(pos.quantity)
  if (tradeQuantity > oldQty) throw new Error(`Недостаточно бумаг: есть ${oldQty}, попытка продать ${tradeQuantity}`)

  const newQty = oldQty - tradeQuantity
  await client.query(
    'UPDATE positions SET quantity = $1, updated_at = NOW() WHERE id = $2',
    [newQty, pos.id]
  )
}

/** Метаданные для создания позиции, если её ещё нет на счёте. */
export interface PositionMeta {
  name?: string
  exchange: string
  assetType: 'equity' | 'bond'
  currency: string
  exchangeRate?: number
}

/**
 * Пересчитать позицию по (accountId, ticker) с нуля из всех оставшихся сделок.
 * Вызывать внутри транзакции, передавая client.
 * Если quantity <= 0 — позиция удаляется.
 * Если позиции нет, но quantity > 0 — создаётся с данными из meta.
 */
export async function rebuildPosition(
  client: { query: typeof pool.query },
  accountId: string,
  ticker: string,
  meta?: PositionMeta,
): Promise<void> {
  // Все сделки по паре (account, ticker) в хронологическом порядке
  const { rows: tradeRows } = await client.query(
    `SELECT side, quantity, price FROM trades
     WHERE account_id = $1 AND ticker = $2
     ORDER BY executed_at ASC`,
    [accountId, ticker],
  )

  let totalQty = 0
  let weightedSum = 0
  let buyQty = 0

  for (const t of tradeRows) {
    const qty = Number(t.quantity)
    const price = Number(t.price)
    if (t.side === 'buy') {
      totalQty += qty
      weightedSum += qty * price
      buyQty += qty
    } else {
      totalQty -= qty
    }
  }

  const avgPrice = buyQty > 0 ? weightedSum / buyQty : 0

  const { rows: posRows } = await client.query(
    'SELECT id FROM positions WHERE account_id = $1 AND ticker = $2',
    [accountId, ticker],
  )

  if (totalQty <= 0) {
    // Нет бумаг — удалить позицию
    await client.query(
      'DELETE FROM positions WHERE account_id = $1 AND ticker = $2',
      [accountId, ticker],
    )
    return
  }

  if (posRows.length > 0) {
    // Позиция существует — обновить quantity и average_price
    await client.query(
      'UPDATE positions SET quantity = $1, average_price = $2, updated_at = NOW() WHERE id = $3',
      [totalQty, avgPrice, posRows[0].id],
    )
  } else {
    // Позиции нет — создать с метаданными
    if (!meta) throw new Error(`Позиция ${ticker} не найдена на счёте, метаданные не переданы`)
    await client.query(
      `INSERT INTO positions
        (account_id, ticker, name, exchange, asset_type, currency, quantity, average_price, averaging_method, exchange_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'WAVG', $9)`,
      [
        accountId, ticker, meta.name ?? ticker,
        meta.exchange, meta.assetType, meta.currency,
        totalQty, avgPrice, meta.exchangeRate ?? 1,
      ],
    )
  }
}
