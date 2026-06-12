import type { Response } from 'express'
import * as svc from '../services/noteService.js'
import { getPosition } from '../services/positionService.js'
import { getAccessibleAccountIds } from '../services/accountService.js'
import type { AuthRequest } from '../middleware/auth.js'

async function canAccessPosition(userId: string, positionId: string): Promise<boolean> {
  const position = await getPosition(positionId)
  if (!position) return false
  const accessible = await getAccessibleAccountIds(userId)
  return accessible.includes(position.accountId as string)
}

export async function list(req: AuthRequest, res: Response) {
  const positionId = req.query.positionId as string | undefined
  if (!positionId) return res.status(400).json({ error: 'positionId is required' })
  if (!(await canAccessPosition(req.userId!, positionId))) return res.status(404).json({ error: 'Position not found' })
  const rows = await svc.listNotes(positionId)
  res.json(rows)
}

export async function create(req: AuthRequest, res: Response) {
  const body = req.body as Parameters<typeof svc.createNote>[0]
  if (!body.positionId || !body.body?.trim()) {
    return res.status(400).json({ error: 'positionId and body are required' })
  }
  if (!(await canAccessPosition(req.userId!, body.positionId))) return res.status(404).json({ error: 'Position not found' })
  const row = await svc.createNote(body)
  res.status(201).json(row)
}

export async function update(req: AuthRequest, res: Response) {
  const { body } = req.body as { body?: string }
  if (!body?.trim()) return res.status(400).json({ error: 'body is required' })
  const existing = await svc.getNote(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Note not found' })
  if (!(await canAccessPosition(req.userId!, existing.positionId as string))) return res.status(404).json({ error: 'Note not found' })
  const row = await svc.updateNote(req.params.id, body)
  if (!row) return res.status(404).json({ error: 'Note not found' })
  res.json(row)
}

export async function remove(req: AuthRequest, res: Response) {
  const existing = await svc.getNote(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Note not found' })
  if (!(await canAccessPosition(req.userId!, existing.positionId as string))) return res.status(404).json({ error: 'Note not found' })
  const ok = await svc.deleteNote(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Note not found' })
  res.status(204).send()
}
