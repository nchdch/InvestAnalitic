import type { Request, Response } from 'express'
import { getPortfolioSummary } from '../services/portfolioService.js'

export async function summary(_req: Request, res: Response) {
  const data = await getPortfolioSummary()
  res.json(data)
}
