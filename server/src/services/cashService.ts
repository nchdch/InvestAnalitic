import { pool } from '../db/pool.js'

export interface CashBalanceRow {
  accountId: string
  currency: string
  amount: number
}

function toRow(r: { account_id: string; currency: string; amount: string }): CashBalanceRow {
  return { accountId: r.account_id, currency: r.currency, amount: Number(r.amount) }
}

export async function listCashBalances(accountIds: string[]): Promise<CashBalanceRow[]> {
  if (accountIds.length === 0) return []
  const { rows } = await pool.query<{ account_id: string; currency: string; amount: string }>(
    'SELECT account_id, currency, amount FROM cash_balances WHERE account_id = ANY($1) AND amount <> 0 ORDER BY currency',
    [accountIds]
  )
  return rows.map(toRow)
}

/** Изменяет баланс счёта на delta (может быть отрицательным). Создаёт строку, если валюты ещё не было. */
export async function adjustCashBalance(accountId: string, currency: string, delta: number): Promise<CashBalanceRow> {
  const { rows } = await pool.query<{ account_id: string; currency: string; amount: string }>(
    `INSERT INTO cash_balances (account_id, currency, amount)
     VALUES ($1, $2, $3)
     ON CONFLICT (account_id, currency)
     DO UPDATE SET amount = cash_balances.amount + EXCLUDED.amount, updated_at = now()
     RETURNING account_id, currency, amount`,
    [accountId, currency.toUpperCase(), delta]
  )
  return toRow(rows[0])
}
