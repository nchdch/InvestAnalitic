import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { resolveAccountIds } from '../services/accountService.js'
import { getPortfolioSummary } from '../services/portfolioService.js'
import { streamChatCompletion, LlmError } from '../services/llmService.js'
import { buildAssistantMessages, type AssistantChatInput } from '../services/assistantService.js'

function isChatInput(value: unknown): value is AssistantChatInput {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (v.role === 'user' || v.role === 'assistant') && typeof v.content === 'string' && v.content.trim() !== ''
}

export async function chat(req: AuthRequest, res: Response) {
  const rawMessages = (req.body as { messages?: unknown[] }).messages
  const history = Array.isArray(rawMessages) ? rawMessages.filter(isChatInput) : []
  if (history.length === 0) {
    return res.status(400).json({ error: 'Поле messages обязательно и должно содержать хотя бы одно сообщение' })
  }

  const orgId = req.query.orgId as string | undefined
  const accountIds = await resolveAccountIds(req.userId!, orgId)
  if (accountIds === null) return res.status(403).json({ error: 'Нет доступа к организации' })

  const portfolio = await getPortfolioSummary(accountIds)
  const messages = buildAssistantMessages(portfolio, history)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const abortController = new AbortController()
  req.on('close', () => abortController.abort())

  try {
    for await (const delta of streamChatCompletion(messages, { signal: abortController.signal })) {
      send('delta', { text: delta })
    }
    send('done', {})
  } catch (err) {
    const message = err instanceof LlmError ? err.message : 'Ошибка при обращении к ИИ-модели'
    if (!(err instanceof LlmError)) console.error('assistant chat error:', err)
    send('error', { error: message })
  } finally {
    res.end()
  }
}
