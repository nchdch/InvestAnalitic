import type { Request, Response } from 'express'
import * as svc from '../services/tradeService.js'

export async function list(req: Request, res: Response) {
  const rows = await svc.listTrades(
    req.query.accountId as string | undefined,
    req.query.ticker as string | undefined,
  )
  res.json(rows)
}

export async function get(req: Request, res: Response) {
  const row = await svc.getTrade(req.params.id)
  if (!row) return res.status(404).json({ error: 'Trade not found' })
  res.json(row)
}

export async function create(req: Request, res: Response) {
  const body = req.body as Parameters<typeof svc.createTrade>[0]
  if (!body.accountId || !body.ticker || !body.side || !body.quantity || !body.price || !body.currency) {
    return res.status(400).json({ error: 'accountId, ticker, side, quantity, price, currency are required' })
  }
  try {
    const row = await svc.createTrade(body)
    res.status(201).json(row)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
}

export async function remove(req: Request, res: Response) {
  const ok = await svc.deleteTrade(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Trade not found' })
  res.status(204).send()
}
