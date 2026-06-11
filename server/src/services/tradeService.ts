import { pool } from '../db/pool.js'
import { applyBuyToPosition, applySellToPosition } from './positionService.js'

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
  const { rowCount } = await pool.query('DELETE FROM trades WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}
