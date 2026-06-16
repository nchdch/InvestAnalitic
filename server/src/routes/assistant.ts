import { Router } from 'express'
import { chat, getConversations, getMessages, removeConversation } from '../controllers/assistantController.js'
import { requireAuth } from '../middleware/auth.js'

export const assistantRouter = Router()
assistantRouter.use(requireAuth)
assistantRouter.post('/chat', chat)
assistantRouter.get('/conversations', getConversations)
assistantRouter.get('/conversations/:id/messages', getMessages)
assistantRouter.delete('/conversations/:id', removeConversation)
