import type { Response } from 'express'
import * as svc from '../services/positionService.js'
import { getAccessibleAccountIds } from '../services/accountService.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function list(req: AuthRequest, res: Response) {
  const accessible = await getAccessibleAccountIds(req.userId!)
  const accountId = req.query.accountId as string | undefined
  if (accountId && !accessible.includes(accountId)) return res.json([])
  const rows = await svc.listPositions(accountId ? [accountId] : accessible)
  res.json(rows)
}

export async function get(req: AuthRequest, res: Response) {
  const row = await svc.getPosition(req.params.id)
  if (!row) return res.status(404).json({ error: 'Position not found' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(row.accountId as string)) return res.status(404).json({ error: 'Position not found' })
  res.json(row)
}

export async function create(req: AuthRequest, res: Response) {
  const body = req.body as Parameters<typeof svc.createPosition>[0]
  if (!body.accountId || !body.ticker || !body.assetType) {
    return res.status(400).json({ error: 'accountId, ticker, assetType are required' })
  }
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(body.accountId)) return res.status(403).json({ error: 'Нет доступа к счёту' })
  const row = await svc.createPosition(body)
  res.status(201).json(row)
}

export async function update(req: AuthRequest, res: Response) {
  const existing = await svc.getPosition(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Position not found' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(existing.accountId as string)) return res.status(404).json({ error: 'Position not found' })
  const row = await svc.updatePosition(req.params.id, req.body as Parameters<typeof svc.updatePosition>[1])
  if (!row) return res.status(404).json({ error: 'Position not found' })
  res.json(row)
}

export async function remove(req: AuthRequest, res: Response) {
  const existing = await svc.getPosition(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Position not found' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(existing.accountId as string)) return res.status(404).json({ error: 'Position not found' })
  const ok = await svc.deletePosition(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Position not found' })
  res.status(204).send()
}
