import { Router } from 'express'
import { search, rate, history, price, indexHistory } from '../controllers/securitiesController.js'

export const securitiesRouter = Router()
securitiesRouter.get('/search', search)
securitiesRouter.get('/rate', rate)
securitiesRouter.get('/history', history)
securitiesRouter.get('/price', price)
securitiesRouter.get('/index-history', indexHistory)
