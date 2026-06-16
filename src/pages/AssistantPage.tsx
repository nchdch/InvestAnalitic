import { useCallback, useEffect, useRef, useState } from 'react'
import { AIMessage, AIComposer } from '../components'
import {
  streamAssistantChat,
  getConversations,
  getConversationMessages,
  deleteConversation,
  type AssistantChatMessage,
  type Conversation,
} from '../api/client'
import { renderMarkdown } from '../utils/markdown'

const WELCOME = 'Привет! Я твой инвестиционный ИИ-аналитик. Знаю твой портфель досконально — спрашивай или добавляй сделки в любой форме.'

export function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantChatMessage[]>([])
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    getConversations().then(setConversations).catch(() => {})
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => feedRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const loadConversation = useCallback(async (id: string) => {
    abortRef.current?.abort()
    setActiveConvId(id)
    setMessages([])
    setStreamingText(null)
    setError(null)
    setLoadingHistory(true)
    try {
      const msgs = await getConversationMessages(id)
      setMessages(msgs as AssistantChatMessage[])
      setTimeout(() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight }), 50)
    } catch {
      setError('Не удалось загрузить историю переписки')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const newChat = () => {
    abortRef.current?.abort()
    setActiveConvId(null)
    setMessages([])
    setStreamingText(null)
    setError(null)
  }

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteConversation(id).catch(() => {})
    setConversations((cs) => cs.filter((c) => c.id !== id))
    if (activeConvId === id) newChat()
  }

  const send = async (text: string) => {
    setError(null)
    const history: AssistantChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setStreamingText('')
    setSending(true)
    scrollToBottom()

    const controller = new AbortController()
    abortRef.current = controller
    let acc = ''

    try {
      const convId = await streamAssistantChat(
        history,
        (delta) => { acc += delta; setStreamingText(acc); scrollToBottom() },
        controller.signal,
        activeConvId ?? undefined,
      )
      setMessages((m) => [...m, { role: 'assistant', content: acc }])
      if (convId && convId !== activeConvId) setActiveConvId(convId)
      getConversations().then(setConversations).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить ответ ассистента')
      if (acc) setMessages((m) => [...m, { role: 'assistant', content: acc }])
    } finally {
      setStreamingText(null)
      setSending(false)
      abortRef.current = null
    }
  }

  return (
    <div className="ia-chat-layout">
      <aside className="ia-chat-sidebar">
        <div className="ia-chat-sidebar__header">
          <button className="ia-chat-sidebar__new" onClick={newChat}>+ Новый чат</button>
        </div>
        <div className="ia-chat-sidebar__list">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`ia-chat-sidebar__item${activeConvId === c.id ? ' ia-chat-sidebar__item--active' : ''}`}
              onClick={() => loadConversation(c.id)}
            >
              <span className="ia-chat-sidebar__item-title">{c.title}</span>
              {c.preview && <span className="ia-chat-sidebar__item-preview">{c.preview}</span>}
              <button
                className="ia-chat-sidebar__item-del"
                onClick={(e) => handleDeleteConversation(e, c.id)}
                title="Удалить чат"
              >×</button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="ia-chat-sidebar__empty">История пуста</p>
          )}
        </div>
      </aside>
      <div className="ia-chat-main">
        <div className="ia-chat__feed" ref={feedRef}>
          {messages.length === 0 && !loadingHistory && (
            <AIMessage role="ai">{renderMarkdown(WELCOME)}</AIMessage>
          )}
          {loadingHistory && <AIMessage role="ai" typing />}
          {messages.map((m, i) => (
            <AIMessage key={i} role={m.role === 'user' ? 'user' : 'ai'}>
              {m.role === 'user'
                ? <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
                : renderMarkdown(m.content)}
            </AIMessage>
          ))}
          {streamingText !== null && (
            streamingText
              ? <AIMessage role="ai">{renderMarkdown(streamingText)}</AIMessage>
              : <AIMessage role="ai" typing />
          )}
          {error && (
            <AIMessage role="ai"><p>⚠️ {error}</p></AIMessage>
          )}
        </div>
        <div className="ia-chat__composer">
          <AIComposer
            onSend={send}
            disabled={sending}
            suggestions={[
              'Покажи текущее состояние портфеля',
              'Когда ближайшие дивиденды?',
              'Стоит ли ребалансировать?',
            ]}
          />
        </div>
      </div>
    </div>
  )
}
