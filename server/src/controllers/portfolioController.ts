import type { Response } from 'express'
import { getPortfolioSummary, refreshPrices as refreshPricesService } from '../services/portfolioService.js'
import { resolveAccountIds } from '../services/accountService.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function summary(req: AuthRequest, res: Response) {
  const orgId = req.query.orgId as string | undefined
  const accountIds = await resolveAccountIds(req.userId!, orgId)
  if (accountIds === null) return res.status(403).json({ error: 'Нет доступа к организации' })
  const data = await getPortfolioSummary(accountIds)
  res.json(data)
}

export async function refreshPrices(req: AuthRequest, res: Response) {
  const orgId = req.query.orgId as string | undefined
  const accountIds = await resolveAccountIds(req.userId!, orgId)
  if (accountIds === null) return res.status(403).json({ error: 'Нет доступа к организации' })
  const result = await refreshPricesService(accountIds)
  res.json(result)
}
