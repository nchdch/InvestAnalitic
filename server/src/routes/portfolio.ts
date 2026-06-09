import { Router } from 'express'
import { summary } from '../controllers/portfolioController.js'

export const portfolioRouter = Router()
portfolioRouter.get('/summary', summary)
