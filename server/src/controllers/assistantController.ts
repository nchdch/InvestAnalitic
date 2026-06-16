import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { resolveAccountIds } from '../services/accountService.js'
import { getPortfolioSummary } from '../services/portfolioService.js'
import { streamChatCompletion, LlmError } from '../services/llmService.js'
import { buildAssistantMessages, type AssistantChatInput } from '../services/assistantService.js'
import {
  listConversations,
  createConversation,
  getConversationMessages,
  getConversationOwner,
  appendMessage,
  deleteConversation,
} from '../services/chatHistoryService.js'

function isChatInput(value: unknown): value is AssistantChatInput {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (v.role === 'user' || v.role === 'assistant') && typeof v.content === 'string' && v.content.trim() !== ''
}

export async function chat(req: AuthRequest, res: Response) {
  const body = req.body as { messages?: unknown[]; conversationId?: string }
  const rawMessages = body.messages
  const history = Array.isArray(rawMessages) ? rawMessages.filter(isChatInput) : []
  if (history.length === 0) {
    return res.status(400).json({ error: 'Поле messages обязательно и должно содержать хотя бы одно сообщение' })
  }

  const orgId = req.query.orgId as string | undefined
  const accountIds = await resolveAccountIds(req.userId!, orgId)
  if (accountIds === null) return res.status(403).json({ error: 'Нет доступа к организации' })

  // Определяем или создаём беседу
  let conversationId = body.conversationId ?? null
  if (conversationId) {
    const owner = await getConversationOwner(conversationId)
    if (owner !== req.userId) conversationId = null // не принадлежит пользователю — создадим новую
  }
  if (!conversationId) {
    const firstUserMsg = history.find((m) => m.role === 'user')?.content ?? 'Новый чат'
    const conv = await createConversation(req.userId!, firstUserMsg)
    conversationId = conv.id
  }

  // Сохраняем новое сообщение пользователя (последнее в истории)
  const lastMsg = history.at(-1)
  if (lastMsg?.role === 'user') {
    await appendMessage(conversationId, 'user', lastMsg.content)
  }

  const portfolio = await getPortfolioSummary(accountIds)
  const messages = buildAssistantMessages(portfolio, history)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('X-Conversation-Id', conversationId)
  res.flushHeaders()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const abortController = new AbortController()
  req.on('close', () => abortController.abort())

  let assistantText = ''
  try {
    for await (const delta of streamChatCompletion(messages, { signal: abortController.signal })) {
      assistantText += delta
      send('delta', { text: delta })
    }
    send('done', { conversationId })
    if (assistantText) await appendMessage(conversationId, 'assistant', assistantText)
  } catch (err) {
    const message = err instanceof LlmError ? err.message : 'Ошибка при обращении к ИИ-модели'
    if (!(err instanceof LlmError)) console.error('assistant chat error:', err)
    if (assistantText) await appendMessage(conversationId, 'assistant', assistantText).catch(() => {})
    send('error', { error: message })
  } finally {
    res.end()
  }
}

export async function getConversations(req: AuthRequest, res: Response) {
  const convs = await listConversations(req.userId!)
  res.json(convs)
}

export async function getMessages(req: AuthRequest, res: Response) {
  const { id } = req.params
  const messages = await getConversationMessages(id, req.userId!)
  res.json(messages)
}

export async function removeConversation(req: AuthRequest, res: Response) {
  const { id } = req.params
  const deleted = await deleteConversation(id, req.userId!)
  res.status(deleted ? 204 : 404).end()
}
