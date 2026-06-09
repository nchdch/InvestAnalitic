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
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function listPositions(accountId?: string) {
  const q = accountId
    ? 'SELECT * FROM positions WHERE account_id = $1 ORDER BY created_at'
    : 'SELECT * FROM positions ORDER BY account_id, created_at'
  const params = accountId ? [accountId] : []
  const { rows } = await pool.query(q, params)
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
  faceValue?: number
  couponRate?: number
  couponDates?: string[]
  maturityDate?: string
  accruedInterest?: number
}

export async function createPosition(input: CreatePositionInput) {
  const { rows } = await pool.query(
    `INSERT INTO positions
      (account_id, ticker, isin, name, exchange, asset_type, currency, quantity,
       average_price, averaging_method, face_value, coupon_rate, coupon_dates,
       maturity_date, accrued_interest)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      input.accountId, input.ticker, input.isin ?? null, input.name ?? null,
      input.exchange, input.assetType, input.currency, input.quantity,
      input.averagePrice, input.averagingMethod ?? 'WAVG',
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
) {
  const { rows } = await client.query(
    'SELECT * FROM positions WHERE account_id = $1 AND ticker = $2 FOR UPDATE',
    [accountId, ticker]
  )

  if (rows.length === 0) {
    // Позиция не существует — создаём
    await client.query(
      `INSERT INTO positions
        (account_id, ticker, name, exchange, asset_type, currency, quantity, average_price, averaging_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'WAVG')`,
      [accountId, ticker, tradeName ?? ticker, exchange, assetType, currency, tradeQuantity, tradePrice]
    )
  } else {
    const pos = rows[0]
    const oldQty = Number(pos.quantity)
    const oldAvg = Number(pos.average_price)
    const newQty = oldQty + tradeQuantity
    const newAvg = (oldQty * oldAvg + tradeQuantity * tradePrice) / newQty
    await client.query(
      'UPDATE positions SET quantity = $1, average_price = $2, updated_at = NOW() WHERE id = $3',
      [newQty, newAvg, pos.id]
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
