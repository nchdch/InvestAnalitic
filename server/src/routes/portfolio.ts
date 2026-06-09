import { Router } from 'express'
import { summary } from '../controllers/portfolioController.js'
import { requireAuth } from '../middleware/auth.js'

export const portfolioRouter = Router()
portfolioRouter.use(requireAuth)
portfolioRouter.get('/summary', summary)
