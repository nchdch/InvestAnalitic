import { Router } from 'express'
import { chat } from '../controllers/assistantController.js'
import { requireAuth } from '../middleware/auth.js'

export const assistantRouter = Router()
assistantRouter.use(requireAuth)
assistantRouter.post('/chat', chat)
