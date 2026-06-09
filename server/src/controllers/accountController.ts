import type { Request, Response } from 'express'
import * as svc from '../services/accountService.js'

export async function list(_req: Request, res: Response) {
  const rows = await svc.listAccounts()
  res.json(rows)
}

export async function get(req: Request, res: Response) {
  const row = await svc.getAccount(req.params.id)
  if (!row) return res.status(404).json({ error: 'Account not found' })
  res.json(row)
}

export async function create(req: Request, res: Response) {
  const { name, broker } = req.body as { name?: string; broker?: string }
  if (!name || !broker) return res.status(400).json({ error: 'name and broker are required' })
  const row = await svc.createAccount(name, broker)
  res.status(201).json(row)
}

export async function update(req: Request, res: Response) {
  const { name, broker } = req.body as { name?: string; broker?: string }
  if (!name || !broker) return res.status(400).json({ error: 'name and broker are required' })
  const row = await svc.updateAccount(req.params.id, name, broker)
  if (!row) return res.status(404).json({ error: 'Account not found' })
  res.json(row)
}

export async function remove(req: Request, res: Response) {
  const ok = await svc.deleteAccount(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Account not found' })
  res.status(204).send()
}
