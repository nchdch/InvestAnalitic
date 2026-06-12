import { pool } from '../db/pool.js'

function toRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    positionId: r.position_id,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function getNote(id: string) {
  const { rows } = await pool.query('SELECT * FROM position_notes WHERE id = $1', [id])
  return rows[0] ? toRow(rows[0]) : null
}

export async function listNotes(positionId: string) {
  const { rows } = await pool.query(
    'SELECT * FROM position_notes WHERE position_id = $1 ORDER BY created_at DESC',
    [positionId]
  )
  return rows.map(toRow)
}

export interface CreateNoteInput {
  positionId: string
  body: string
}

export async function createNote(input: CreateNoteInput) {
  const { rows } = await pool.query(
    `INSERT INTO position_notes (position_id, body) VALUES ($1, $2) RETURNING *`,
    [input.positionId, input.body]
  )
  return toRow(rows[0])
}

export async function updateNote(id: string, body: string) {
  const { rows } = await pool.query(
    `UPDATE position_notes SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [body, id]
  )
  return rows[0] ? toRow(rows[0]) : null
}

export async function deleteNote(id: string) {
  const { rowCount } = await pool.query('DELETE FROM position_notes WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}
