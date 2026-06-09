Labelled text/number field with affixes, hint and error. Use `numeric` for money/quantity.

```jsx
<Input label="Тикер" placeholder="SBER" prefix={<i data-lucide="search" />} />
<Input label="Цена" numeric suffix="₽" defaultValue="286,40" />
<Input label="Количество лотов" numeric defaultValue="50" hint="1 лот = 10 акций" />
<Input label="Комиссия" numeric suffix="₽" error="Не может быть отрицательной" />
```

Sizes `sm | md | lg`. Props: `required`, `prefix`, `suffix`, `hint`, `error`, `numeric`, plus native input attrs.
