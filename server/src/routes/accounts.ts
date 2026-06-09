import { Router } from 'express'
import { list, get, create, update, remove } from '../controllers/accountController.js'
import { requireAuth } from '../middleware/auth.js'

export const accountRouter = Router()
accountRouter.use(requireAuth)
accountRouter.get('/', list)
accountRouter.post('/', create)
accountRouter.get('/:id', get)
accountRouter.put('/:id', update)
accountRouter.delete('/:id', remove)
