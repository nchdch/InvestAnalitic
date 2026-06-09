import { Router } from 'express'
import { list, get, create, remove, stats } from '../controllers/paymentController.js'

export const paymentRouter = Router()
paymentRouter.get('/stats', stats)
paymentRouter.get('/', list)
paymentRouter.post('/', create)
paymentRouter.get('/:id', get)
paymentRouter.delete('/:id', remove)
