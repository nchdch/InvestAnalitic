import React, { useEffect, useRef, useState } from 'react'
import { AIMessage, AIComposer } from '../components'
import { streamAssistantChat, type AssistantChatMessage } from '../api/client'
import { renderMarkdown } from '../utils/markdown'

const WELCOME = 'Привет! Я твой инвестиционный ИИ-аналитик. Знаю твой портфель досконально — спрашивай или добавляй сделки в любой форме.'

export function AssistantPage() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([])
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const scrollToBottom = () => {
    setTimeout(() => feedRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 50)
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
      await streamAssistantChat(history, (delta) => {
        acc += delta
        setStreamingText(acc)
        scrollToBottom()
      }, controller.signal)
      setMessages((m) => [...m, { role: 'assistant', content: acc }])
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
    <div className="ia-screen ia-chat">
      <div className="ia-chat__feed" ref={feedRef}>
        <AIMessage role="ai">{renderMarkdown(WELCOME)}</AIMessage>
        {messages.map((m, i) => (
          <AIMessage key={i} role={m.role === 'user' ? 'user' : 'ai'}>
            {m.role === 'user'
              ? <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
              : renderMarkdown(m.content)}
          </AIMessage>
        ))}
        {streamingText !== null && (
          streamingText ? <AIMessage role="ai">{renderMarkdown(streamingText)}</AIMessage> : <AIMessage role="ai" typing />
        )}
        {error && (
          <AIMessage role="ai">
            <p>⚠️ {error}</p>
          </AIMessage>
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
  )
}
