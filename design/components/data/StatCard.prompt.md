Headline metric — label, big tabular figure, optional P&L delta + caption. For the portfolio total and summaries.

```jsx
<StatCard size="xl" label="Стоимость портфеля" value="2 480 350,00 ₽"
  delta={48230} deltaPercent={1.98} caption="за сегодня" />
<StatCard label="Доходность за всё время" value="+38,2" unit="%"
  icon={<i data-lucide="trending-up" />} />
```

Pre-format `value` to house style. `delta`/`deltaPercent` are numbers → coloured PnLValue. Sizes `sm | md | lg | xl`.
