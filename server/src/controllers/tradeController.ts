import type { Response } from 'express'
import * as svc from '../services/tradeService.js'
import { getAccessibleAccountIds } from '../services/accountService.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function list(req: AuthRequest, res: Response) {
  const accessible = await getAccessibleAccountIds(req.userId!)
  const accountId = req.query.accountId as string | undefined
  if (accountId && !accessible.includes(accountId)) return res.json([])
  const rows = await svc.listTrades(
    accountId ? [accountId] : accessible,
    req.query.ticker as string | undefined,
  )
  res.json(rows)
}

export async function get(req: AuthRequest, res: Response) {
  const row = await svc.getTrade(req.params.id)
  if (!row) return res.status(404).json({ error: 'Trade not found' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(row.accountId as string)) return res.status(404).json({ error: 'Trade not found' })
  res.json(row)
}

export async function create(req: AuthRequest, res: Response) {
  const body = req.body as Parameters<typeof svc.createTrade>[0]
  if (!body.accountId || !body.ticker || !body.side || !body.quantity || !body.price || !body.currency) {
    return res.status(400).json({ error: 'accountId, ticker, side, quantity, price, currency are required' })
  }
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(body.accountId)) return res.status(403).json({ error: 'Нет доступа к счёту' })
  try {
    const row = await svc.createTrade(body)
    res.status(201).json(row)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  const existing = await svc.getTrade(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Trade not found' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(existing.accountId as string)) return res.status(404).json({ error: 'Trade not found' })
  const ok = await svc.deleteTrade(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Trade not found' })
  res.status(204).send()
}
