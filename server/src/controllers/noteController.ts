import type { Request, Response } from 'express'
import * as svc from '../services/noteService.js'

export async function list(req: Request, res: Response) {
  const positionId = req.query.positionId as string | undefined
  if (!positionId) return res.status(400).json({ error: 'positionId is required' })
  const rows = await svc.listNotes(positionId)
  res.json(rows)
}

export async function create(req: Request, res: Response) {
  const body = req.body as Parameters<typeof svc.createNote>[0]
  if (!body.positionId || !body.body?.trim()) {
    return res.status(400).json({ error: 'positionId and body are required' })
  }
  const row = await svc.createNote(body)
  res.status(201).json(row)
}

export async function update(req: Request, res: Response) {
  const { body } = req.body as { body?: string }
  if (!body?.trim()) return res.status(400).json({ error: 'body is required' })
  const row = await svc.updateNote(req.params.id, body)
  if (!row) return res.status(404).json({ error: 'Note not found' })
  res.json(row)
}

export async function remove(req: Request, res: Response) {
  const ok = await svc.deleteNote(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Note not found' })
  res.status(204).send()
}
