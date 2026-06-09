import type { Request, Response } from 'express'
import * as svc from '../services/positionService.js'

export async function list(req: Request, res: Response) {
  const rows = await svc.listPositions(req.query.accountId as string | undefined)
  res.json(rows)
}

export async function get(req: Request, res: Response) {
  const row = await svc.getPosition(req.params.id)
  if (!row) return res.status(404).json({ error: 'Position not found' })
  res.json(row)
}

export async function create(req: Request, res: Response) {
  const body = req.body as Parameters<typeof svc.createPosition>[0]
  if (!body.accountId || !body.ticker || !body.assetType) {
    return res.status(400).json({ error: 'accountId, ticker, assetType are required' })
  }
  const row = await svc.createPosition(body)
  res.status(201).json(row)
}

export async function update(req: Request, res: Response) {
  const row = await svc.updatePosition(req.params.id, req.body as Parameters<typeof svc.updatePosition>[1])
  if (!row) return res.status(404).json({ error: 'Position not found' })
  res.json(row)
}

export async function remove(req: Request, res: Response) {
  const ok = await svc.deletePosition(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Position not found' })
  res.status(204).send()
}
