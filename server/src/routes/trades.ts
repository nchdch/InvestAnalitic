import { Router } from 'express'
import { list, get, create, remove } from '../controllers/tradeController.js'
import { requireAuth } from '../middleware/auth.js'

export const tradeRouter = Router()
tradeRouter.use(requireAuth)
tradeRouter.get('/', list)
tradeRouter.post('/', create)
tradeRouter.get('/:id', get)
tradeRouter.delete('/:id', remove)
