import { Router } from 'express'
import { list, create, update, remove } from '../controllers/noteController.js'

export const noteRouter = Router()
noteRouter.get('/', list)
noteRouter.post('/', create)
noteRouter.put('/:id', update)
noteRouter.delete('/:id', remove)
