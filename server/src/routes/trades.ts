import { Router } from 'express'
import { list, get, create, remove } from '../controllers/tradeController.js'

export const tradeRouter = Router()
tradeRouter.get('/', list)
tradeRouter.post('/', create)
tradeRouter.get('/:id', get)
tradeRouter.delete('/:id', remove)
