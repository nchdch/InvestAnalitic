import React, { useState, useRef } from 'react'
import { AIMessage, AIComposer, Button } from '../components'

interface Message {
  role: 'ai' | 'user'
  body: React.ReactNode
  actions?: React.ReactNode
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'ai',
    body: (
      <p>
        Привет! Я твой инвестиционный ИИ-аналитик. Знаю твой портфель досконально —
        спрашивай или добавляй сделки в любой форме.
      </p>
    ),
  },
  {
    role: 'user',
    body: 'Как мой портфель за месяц?',
  },
  {
    role: 'ai',
    body: (
      <>
        <p>
          За месяц портфель <strong>+4,8%</strong> (+114 200 ₽). Основной вклад —
          YDEX (+17,5%) и SBER (+31,1% за всё время).
        </p>
        <p>
          Что настораживает: GAZP в минусе на −21%, тянет результат вниз.
          И LKOH разросся до 28,9% — стоит присмотреться к балансу.
        </p>
      </>
    ),
    actions: (
      <>
        <Button variant="soft" size="sm">Разобрать GAZP</Button>
        <Button variant="ghost" size="sm">Показать P&L</Button>
      </>
    ),
  },
]

export function AssistantPage() {
  const [msgs, setMsgs] = useState<Message[]>(INITIAL_MESSAGES)
  const [typing, setTyping] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  const send = (text: string) => {
    setMsgs((m) => [...m, { role: 'user', body: text }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [
        ...m,
        {
          role: 'ai',
          body: (
            <p>
              Записал: «{text}». В демо-режиме ответ — заглушка,
              но в продукте здесь будет конкретный разбор с цифрами из портфеля
              и вариантами действий.
            </p>
          ),
        },
      ])
      setTimeout(() => {
        feedRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }, 1400)
  }

  return (
    <div className="ia-screen ia-chat">
      <div className="ia-chat__feed" ref={feedRef}>
        {msgs.map((m, i) => (
          <AIMessage key={i} role={m.role} actions={m.actions}>
            {m.body}
          </AIMessage>
        ))}
        {typing && <AIMessage role="ai" typing />}
      </div>
      <div className="ia-chat__composer">
        <AIComposer
          onSend={send}
          suggestions={[
            'Когда ближайшие дивиденды?',
            'Стоит ли ребалансировать?',
            'Какой у меня налог при продаже LKOH?',
          ]}
        />
      </div>
    </div>
  )
}
