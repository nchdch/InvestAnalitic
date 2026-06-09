import { Router } from 'express'
import { search, rate } from '../controllers/securitiesController.js'

export const securitiesRouter = Router()
securitiesRouter.get('/search', search)
securitiesRouter.get('/rate', rate)
