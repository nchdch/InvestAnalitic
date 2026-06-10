import { Router } from 'express'
import { search, rate, history } from '../controllers/securitiesController.js'

export const securitiesRouter = Router()
securitiesRouter.get('/search', search)
securitiesRouter.get('/rate', rate)
securitiesRouter.get('/history', history)
