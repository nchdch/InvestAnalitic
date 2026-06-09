Surface container with hairline border + soft shadow. The base block for account panels, summaries, dialog bodies.

```jsx
<Card title="Облигации" subtitle="3 позиции" actions={<IconButton label="Меню"><i data-lucide="more-horizontal" /></IconButton>}>
  …
</Card>
<Card tightBody> <PositionsTable … /> </Card>   {/* edge-to-edge table */}
<Card interactive elevation="flat">…</Card>
```

`elevation`: `flat | sm | md`. Props: `title`, `subtitle`, `actions`, `interactive`, `tightBody`.
