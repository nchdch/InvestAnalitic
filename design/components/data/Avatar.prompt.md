Broker tile / avatar — image or colour-coded initials from `name`.

```jsx
<Avatar name="Сбер Инвестиции" />          {/* square tile "СИ" */}
<Avatar name="Т-Банк" color="var(--ink-700)" />
<Avatar name="Пользователь" shape="circle" size="sm" />
```

`shape`: `square` (broker) | `circle` (person). Sizes `sm | md | lg`. Tile colour is deterministic from the name unless `color` is set.
