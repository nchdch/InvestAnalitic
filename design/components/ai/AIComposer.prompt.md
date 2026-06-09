The persistent AI composer — the product's spine. Free-text trade entry + questions, with the azure accent glow on focus.

```jsx
<AIComposer
  onSend={(text) => handleUserMessage(text)}
  suggestions={[
    'Как мой портфель за месяц?',
    'Когда ближайшие дивиденды?',
    'Стоит ли ребалансировать?',
  ]}
/>
```

`onSend(text)` fires on Enter / send (Shift+Enter = newline). Auto-grows. Dock it at the bottom of the conversation or as a right-rail footer — always reachable.
