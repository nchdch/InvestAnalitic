Primary action control — use for any clickable action; one `primary` per view, the rest `secondary`/`ghost`.

```jsx
<Button variant="primary" size="md" onClick={addTrade}>Добавить сделку</Button>
<Button variant="secondary" leftIcon={<i data-lucide="download" />}>Импорт из Excel</Button>
<Button variant="ghost" size="sm">Отмена</Button>
<Button variant="soft">Показать варианты</Button>
<Button variant="danger" loading>Удаление…</Button>
```

Variants: `primary` (azure fill), `secondary` (outlined), `ghost` (transparent), `soft` (azure tint), `danger` (red). Sizes: `sm | md | lg`. Props: `block`, `loading`, `disabled`, `leftIcon`, `rightIcon`, `as="a"`. Icons are passed as nodes — pair with Lucide.
