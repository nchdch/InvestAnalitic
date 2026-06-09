Tab bar — section nav (Акции/Облигации/Деньги) or filters. Controlled.

```jsx
<Tabs value={tab} onChange={setTab} items={[
  { value: 'eq', label: 'Акции', count: 12 },
  { value: 'bond', label: 'Облигации', count: 5 },
  { value: 'cash', label: 'Деньги' },
]} />
<Tabs variant="pill" value={p} onChange={setP} items={periods} />
```

`variant`: `line` (primary) | `pill` (segmented). Items carry optional `count` and `icon`.
