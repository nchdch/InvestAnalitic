import type { Response } from 'express'
import * as svc from '../services/paymentService.js'
import { getAccessibleAccountIds } from '../services/accountService.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function list(req: AuthRequest, res: Response) {
  const year = req.query.year ? Number(req.query.year) : undefined
  const accessible = await getAccessibleAccountIds(req.userId!)
  const accountId = req.query.accountId as string | undefined
  if (accountId && !accessible.includes(accountId)) return res.json([])
  const rows = await svc.listPayments(accountId ? [accountId] : accessible, year)
  res.json(rows)
}

export async function get(req: AuthRequest, res: Response) {
  const row = await svc.getPayment(req.params.id)
  if (!row) return res.status(404).json({ error: 'Payment not found' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(row.accountId as string)) return res.status(404).json({ error: 'Payment not found' })
  res.json(row)
}

export async function create(req: AuthRequest, res: Response) {
  const body = req.body as Parameters<typeof svc.createPayment>[0]
  if (!body.accountId || !body.ticker || !body.type || !body.grossAmount || !body.currency) {
    return res.status(400).json({ error: 'accountId, ticker, type, grossAmount, currency are required' })
  }
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(body.accountId)) return res.status(403).json({ error: 'Нет доступа к счёту' })
  const row = await svc.createPayment(body)
  res.status(201).json(row)
}

export async function remove(req: AuthRequest, res: Response) {
  const existing = await svc.getPayment(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Payment not found' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(existing.accountId as string)) return res.status(404).json({ error: 'Payment not found' })
  const ok = await svc.deletePayment(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Payment not found' })
  res.status(204).send()
}

export async function stats(req: AuthRequest, res: Response) {
  const accessible = await getAccessibleAccountIds(req.userId!)
  const accountId = req.query.accountId as string | undefined
  if (accountId && !accessible.includes(accountId)) return res.json({ totalGross: 0, totalNet: 0, totalTax: 0, count: 0 })
  const row = await svc.getPaymentStats(accountId ? [accountId] : accessible)
  res.json(row)
}
