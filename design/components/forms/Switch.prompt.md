Boolean toggle for settings — immediate on/off.

```jsx
<Switch label="Проактивные уведомления" defaultChecked />
<Switch label="Тёмная тема" checked={dark} onChange={(e) => setDark(e.target.checked)} />
```

Sizes `md | lg`. Controlled (`checked`+`onChange`) or uncontrolled (`defaultChecked`).
