The signature P&L figure — sign, color, arrow, tabular figures, house formatting. Use everywhere a gain/loss is shown.

```jsx
<PnLValue value={48230} percent={12.34} display="both" />   {/* +48 230,00 ₽ (+12,34%) */}
<PnLValue value={-4120} display="money" />                  {/* −4 120,00 ₽ in red */}
<PnLValue percent={-4.1} display="percent" badge />         {/* red pill: −4,10% */}
<PnLValue value={680400} percent={38.2} size="xl" />        {/* hero figure */}
```

Pass a signed number; direction (up/down/flat → emerald/red/slate) is derived. `display`: `money | percent | both`. Sizes `sm | md | lg | xl`. `badge` for a tinted pill, `arrow` toggles the glyph.
