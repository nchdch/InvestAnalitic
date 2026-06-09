A single chat turn — the product's centrepiece. AI = gradient spark avatar + violet-tinted bubble + action chips; user = azure right bubble.

```jsx
<AIMessage role="user">Купил 5 лотов Сбера по 286</AIMessage>

<AIMessage role="ai" actions={[
  <Button key="1" variant="soft" size="sm">Открыть позицию</Button>,
  <Button key="2" variant="ghost" size="sm">Отменить</Button>,
]}>
  <p>Записал: <strong>+50 SBER</strong> по 286,00 ₽ на счёт «Сбер Инвестиции». Сумма сделки — 14 300,00 ₽.</p>
  <p>Это увеличило долю SBER в портфеле до 9,2%. Пока в пределах нормы.</p>
</AIMessage>

<AIMessage role="ai" typing />
```

Write copy in house voice: «ты», concrete figures, short read, CTA. Lead proactive messages with one signal emoji.
