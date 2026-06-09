import type { Request, Response } from 'express'
import * as svc from '../services/paymentService.js'

export async function list(req: Request, res: Response) {
  const year = req.query.year ? Number(req.query.year) : undefined
  const rows = await svc.listPayments(req.query.accountId as string | undefined, year)
  res.json(rows)
}

export async function get(req: Request, res: Response) {
  const row = await svc.getPayment(req.params.id)
  if (!row) return res.status(404).json({ error: 'Payment not found' })
  res.json(row)
}

export async function create(req: Request, res: Response) {
  const body = req.body as Parameters<typeof svc.createPayment>[0]
  if (!body.accountId || !body.ticker || !body.type || !body.grossAmount || !body.currency) {
    return res.status(400).json({ error: 'accountId, ticker, type, grossAmount, currency are required' })
  }
  const row = await svc.createPayment(body)
  res.status(201).json(row)
}

export async function remove(req: Request, res: Response) {
  const ok = await svc.deletePayment(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Payment not found' })
  res.status(204).send()
}

export async function stats(req: Request, res: Response) {
  const row = await svc.getPaymentStats(req.query.accountId as string | undefined)
  res.json(row)
}
