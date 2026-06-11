import { Router } from 'express'
import { list, get, create, remove, stats } from '../controllers/paymentController.js'
import { requireAuth } from '../middleware/auth.js'

export const paymentRouter = Router()
paymentRouter.use(requireAuth)
paymentRouter.get('/stats', stats)
paymentRouter.get('/', list)
paymentRouter.post('/', create)
paymentRouter.get('/:id', get)
paymentRouter.delete('/:id', remove)
