Native select with system field chrome — for account / period / currency pickers.

```jsx
<Select label="Счёт" options={[
  { value: 'sber', label: 'Сбер Инвестиции' },
  { value: 'tbank', label: 'Т-Банк Инвестиции' },
]} />
<Select label="Период" size="sm">
  <option>День</option><option>Неделя</option><option>Месяц</option><option>Год</option>
</Select>
```

Sizes `sm | md | lg`. Provide `options=[{value,label}]` or `<option>` children; `placeholder` adds a disabled lead option.
