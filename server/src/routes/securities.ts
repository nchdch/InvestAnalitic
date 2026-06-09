import { Router } from 'express'
import { search } from '../controllers/securitiesController.js'

export const securitiesRouter = Router()
securitiesRouter.get('/search', search)
