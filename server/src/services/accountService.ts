import { pool } from '../db/pool.js'

export async function listAccounts() {
  const { rows } = await pool.query(
    'SELECT id, name, broker, created_at AS "createdAt" FROM accounts ORDER BY created_at'
  )
  return rows
}

export async function getAccount(id: string) {
  const { rows } = await pool.query(
    'SELECT id, name, broker, created_at AS "createdAt" FROM accounts WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function createAccount(name: string, broker: string) {
  const { rows } = await pool.query(
    'INSERT INTO accounts (name, broker) VALUES ($1, $2) RETURNING id, name, broker, created_at AS "createdAt"',
    [name, broker]
  )
  return rows[0]
}

export async function updateAccount(id: string, name: string, broker: string) {
  const { rows } = await pool.query(
    'UPDATE accounts SET name = $1, broker = $2 WHERE id = $3 RETURNING id, name, broker, created_at AS "createdAt"',
    [name, broker, id]
  )
  return rows[0] ?? null
}

export async function deleteAccount(id: string) {
  const { rowCount } = await pool.query('DELETE FROM accounts WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}
