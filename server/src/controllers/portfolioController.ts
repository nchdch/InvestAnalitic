import type { Response } from 'express'
import { getPortfolioSummary, refreshPrices as refreshPricesService } from '../services/portfolioService.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function summary(req: AuthRequest, res: Response) {
  const orgId = req.query.orgId as string | undefined
  const data = await getPortfolioSummary(orgId)
  res.json(data)
}

export async function refreshPrices(req: AuthRequest, res: Response) {
  const orgId = req.query.orgId as string | undefined
  const result = await refreshPricesService(orgId)
  res.json(result)
}
