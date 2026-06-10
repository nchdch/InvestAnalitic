import { Router } from 'express'
import { list, createTransaction } from '../controllers/cashController.js'
import { requireAuth } from '../middleware/auth.js'

export const cashRouter = Router()
cashRouter.use(requireAuth)
cashRouter.get('/', list)
cashRouter.post('/transactions', createTransaction)
