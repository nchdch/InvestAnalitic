import { pool } from '../db/pool.js'

function toRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    accountId: r.account_id,
    ticker: r.ticker,
    type: r.type,
    paymentDate: r.payment_date,
    grossAmount: Number(r.gross_amount),
    taxWithheld: Number(r.tax_withheld),
    netAmount: Number(r.net_amount),
    currency: r.currency,
    createdAt: r.created_at,
  }
}

export async function listPayments(accountIds: string[], year?: number) {
  if (accountIds.length === 0) return []
  let q = 'SELECT * FROM payments WHERE account_id = ANY($1)'
  const params: unknown[] = [accountIds]
  if (year) {
    params.push(`${year}-01-01`); params.push(`${year}-12-31`)
    q += ` AND payment_date BETWEEN $${params.length - 1} AND $${params.length}`
  }
  q += ' ORDER BY payment_date DESC'
  const { rows } = await pool.query(q, params)
  return rows.map(toRow)
}

export async function getPayment(id: string) {
  const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id])
  return rows[0] ? toRow(rows[0]) : null
}

export interface CreatePaymentInput {
  accountId: string
  ticker: string
  type: 'dividend' | 'coupon' | 'amortization' | 'redemption'
  paymentDate?: string
  grossAmount: number
  taxWithheld?: number
  netAmount?: number
  currency: string
}

export async function createPayment(input: CreatePaymentInput) {
  const gross = input.grossAmount
  const tax = input.taxWithheld ?? Math.round(gross * 0.13 * 100) / 100
  const net = input.netAmount ?? Math.round((gross - tax) * 100) / 100
  const { rows } = await pool.query(
    `INSERT INTO payments (account_id, ticker, type, payment_date, gross_amount, tax_withheld, net_amount, currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.accountId, input.ticker, input.type,
      input.paymentDate ?? new Date().toISOString().slice(0, 10),
      gross, tax, net, input.currency,
    ]
  )
  return toRow(rows[0])
}

export async function deletePayment(id: string) {
  const { rowCount } = await pool.query('DELETE FROM payments WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}

export async function getPaymentStats(accountIds: string[]) {
  if (accountIds.length === 0) return { totalGross: 0, totalNet: 0, totalTax: 0, count: 0 }
  const { rows } = await pool.query(
    `SELECT
      SUM(gross_amount) AS total_gross,
      SUM(net_amount) AS total_net,
      SUM(tax_withheld) AS total_tax,
      COUNT(*) AS count
    FROM payments WHERE account_id = ANY($1)`,
    [accountIds]
  )
  const r = rows[0]
  return {
    totalGross: Number(r.total_gross ?? 0),
    totalNet: Number(r.total_net ?? 0),
    totalTax: Number(r.total_tax ?? 0),
    count: Number(r.count ?? 0),
  }
}
