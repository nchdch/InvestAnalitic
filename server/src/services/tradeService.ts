import { pool } from '../db/pool.js'
import { applyBuyToPosition, applySellToPosition, rebuildPosition } from './positionService.js'

function toRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    accountId: r.account_id,
    ticker: r.ticker,
    side: r.side,
    quantity: Number(r.quantity),
    price: Number(r.price),
    fee: Number(r.fee),
    currency: r.currency,
    executedAt: r.executed_at,
    createdAt: r.created_at,
  }
}

export async function listTrades(accountIds: string[], ticker?: string) {
  if (accountIds.length === 0) return []
  let q = 'SELECT * FROM trades WHERE account_id = ANY($1)'
  const params: unknown[] = [accountIds]
  if (ticker) { params.push(ticker); q += ` AND ticker = $${params.length}` }
  q += ' ORDER BY executed_at DESC'
  const { rows } = await pool.query(q, params)
  return rows.map(toRow)
}

export async function getTrade(id: string) {
  const { rows } = await pool.query('SELECT * FROM trades WHERE id = $1', [id])
  return rows[0] ? toRow(rows[0]) : null
}

export interface CreateTradeInput {
  accountId: string
  ticker: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fee?: number
  currency: string
  executedAt?: string
  exchange?: string
  assetType?: 'equity' | 'bond'
  name?: string
  exchangeRate?: number
}

export async function createTrade(input: CreateTradeInput) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO trades (account_id, ticker, side, quantity, price, fee, currency, executed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.accountId, input.ticker, input.side,
        input.quantity, input.price, input.fee ?? 0,
        input.currency, input.executedAt ?? new Date().toISOString(),
      ]
    )
    const trade = rows[0]

    if (input.side === 'buy') {
      await applyBuyToPosition(
        client,
        input.accountId,
        input.ticker,
        input.quantity,
        input.price,
        input.exchange ?? 'MOEX',
        input.currency,
        input.assetType ?? 'equity',
        input.name,
        input.exchangeRate,
      )
    } else {
      await applySellToPosition(client, input.accountId, input.ticker, input.quantity)
    }

    await client.query('COMMIT')
    return toRow(trade)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteTrade(id: string) {
  const existing = await getTrade(id)
  if (!existing) return false

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM trades WHERE id = $1', [id])
    await rebuildPosition(client, existing.accountId as string, existing.ticker as string)
    await client.query('COMMIT')
    return true
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export interface UpdateTradeInput {
  quantity?: number
  price?: number
  fee?: number
  currency?: string
  executedAt?: string
  accountId?: string
}

export async function updateTrade(id: string, patch: UpdateTradeInput) {
  const existing = await getTrade(id)
  if (!existing) return null

  const oldAccountId = existing.accountId as string
  const ticker = existing.ticker as string
  const newAccountId = patch.accountId ?? oldAccountId
  const accountChanged = newAccountId !== oldAccountId

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Получить метаданные позиции на старом счёте (для создания на новом, если нужно)
    const { rows: metaRows } = await client.query(
      'SELECT name, exchange, asset_type, currency, exchange_rate FROM positions WHERE account_id = $1 AND ticker = $2',
      [oldAccountId, ticker],
    )
    const oldMeta = metaRows[0]

    const fields: string[] = []
    const vals: unknown[] = []
    let i = 1
    const add = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); vals.push(val) }

    if (patch.quantity !== undefined) add('quantity', patch.quantity)
    if (patch.price !== undefined) add('price', patch.price)
    if (patch.fee !== undefined) add('fee', patch.fee)
    if (patch.currency !== undefined) add('currency', patch.currency)
    if (patch.executedAt !== undefined) add('executed_at', patch.executedAt)
    if (patch.accountId !== undefined) add('account_id', patch.accountId)

    if (fields.length > 0) {
      vals.push(id)
      await client.query(
        `UPDATE trades SET ${fields.join(', ')} WHERE id = $${i}`,
        vals,
      )
    }

    // Пересчитать позицию на старом счёте
    await rebuildPosition(client, oldAccountId, ticker)

    // Если счёт изменился — пересчитать на новом счёте
    if (accountChanged) {
      if (!oldMeta) {
        throw new Error(`Невозможно перенести сделку: позиция ${ticker} не найдена на исходном счёте`)
      }
      await rebuildPosition(client, newAccountId, ticker, {
        name: oldMeta.name,
        exchange: oldMeta.exchange,
        assetType: oldMeta.asset_type as 'equity' | 'bond',
        currency: oldMeta.currency,
        exchangeRate: Number(oldMeta.exchange_rate),
      })
    }

    await client.query('COMMIT')
    return getTrade(id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
