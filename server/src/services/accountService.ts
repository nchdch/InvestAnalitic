import { pool } from '../db/pool.js'

export async function listAccounts(orgId?: string) {
  const { rows } = orgId
    ? await pool.query(
        'SELECT id, name, broker, created_at AS "createdAt" FROM accounts WHERE org_id = $1 ORDER BY created_at',
        [orgId]
      )
    : await pool.query(
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

export async function createAccount(name: string, broker: string, userId?: string, orgId?: string) {
  const { rows } = await pool.query(
    'INSERT INTO accounts (name, broker, user_id, org_id) VALUES ($1, $2, $3, $4) RETURNING id, name, broker, created_at AS "createdAt"',
    [name, broker, userId ?? null, orgId ?? null]
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

/**
 * ID счетов, доступных пользователю: его собственные счета (user_id), счета организаций,
 * в которых он состоит активным участником, и счета без владельца (созданные до появления user_id —
 * остаются доступными всем авторизованным пользователям, чтобы не потерять доступ к старым данным).
 */
export async function getAccessibleAccountIds(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT DISTINCT a.id FROM accounts a
     LEFT JOIN org_memberships m ON m.org_id = a.org_id AND m.status = 'active' AND m.user_id = $1
     WHERE a.user_id = $1 OR a.user_id IS NULL OR m.id IS NOT NULL`,
    [userId]
  )
  return rows.map((r) => r.id)
}
