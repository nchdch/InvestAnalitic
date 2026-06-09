Stacked allocation bar + legend — the system's primary "chart". For composition, sector, account weights.

```jsx
<AllocationBar segments={[
  { label: 'Акции', value: 1680000 },
  { label: 'Облигации', value: 620000 },
  { label: 'Деньги', value: 180350 },
]} />
```

Values are normalised to %, so pass raw rubles or percentages. Colours auto-assign (azure-led, avoids P&L hues). `size`: `md | lg`; `showLegend` toggles the legend.
