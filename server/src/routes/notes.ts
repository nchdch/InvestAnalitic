import { Router } from 'express'
import { list, create, update, remove } from '../controllers/noteController.js'
import { requireAuth } from '../middleware/auth.js'

export const noteRouter = Router()
noteRouter.use(requireAuth)
noteRouter.get('/', list)
noteRouter.post('/', create)
noteRouter.put('/:id', update)
noteRouter.delete('/:id', remove)
