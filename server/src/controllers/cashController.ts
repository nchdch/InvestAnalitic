import type { Response } from 'express'
import * as svc from '../services/cashService.js'
import { getAccessibleAccountIds } from '../services/accountService.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function list(req: AuthRequest, res: Response) {
  const accountId = req.query.accountId as string | undefined
  if (!accountId) return res.status(400).json({ error: 'accountId is required' })
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(accountId)) return res.status(404).json({ error: 'Account not found' })
  const rows = await svc.listCashBalances([accountId])
  res.json(rows)
}

export async function createTransaction(req: AuthRequest, res: Response) {
  const { accountId, currency, amount } = req.body as { accountId?: string; currency?: string; amount?: number }
  if (!accountId || !currency || !amount) {
    return res.status(400).json({ error: 'accountId, currency and amount are required' })
  }
  if (typeof amount !== 'number' || amount === 0 || !Number.isFinite(amount)) {
    return res.status(400).json({ error: 'amount must be a non-zero number' })
  }
  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(accountId)) return res.status(404).json({ error: 'Account not found' })
  const row = await svc.adjustCashBalance(accountId, currency, amount)
  res.status(201).json(row)
}
