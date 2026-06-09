import { Router } from 'express'
import { list, get, create, update, remove } from '../controllers/positionController.js'

export const positionRouter = Router()
positionRouter.get('/', list)
positionRouter.post('/', create)
positionRouter.get('/:id', get)
positionRouter.put('/:id', update)
positionRouter.delete('/:id', remove)
