import type { Response } from 'express'
import * as svc from '../services/accountService.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function list(req: AuthRequest, res: Response) {
  const orgId = req.query.orgId as string | undefined
  const rows = await svc.listAccounts(orgId)
  res.json(rows)
}

export async function get(req: AuthRequest, res: Response) {
  const row = await svc.getAccount(req.params.id)
  if (!row) return res.status(404).json({ error: 'Account not found' })
  res.json(row)
}

export async function create(req: AuthRequest, res: Response) {
  const { name, broker, orgId } = req.body as { name?: string; broker?: string; orgId?: string }
  if (!name || !broker) return res.status(400).json({ error: 'name and broker are required' })
  const row = await svc.createAccount(name, broker, req.userId, orgId)
  res.status(201).json(row)
}

export async function update(req: AuthRequest, res: Response) {
  const { name, broker } = req.body as { name?: string; broker?: string }
  if (!name || !broker) return res.status(400).json({ error: 'name and broker are required' })
  const row = await svc.updateAccount(req.params.id, name, broker)
  if (!row) return res.status(404).json({ error: 'Account not found' })
  res.json(row)
}

export async function remove(req: AuthRequest, res: Response) {
  const ok = await svc.deleteAccount(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Account not found' })
  res.status(204).send()
}
