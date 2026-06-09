---
name: InvestAnalitic Design System
description: >
  Visual language + component library for InvestAnalitic — an AI-first
  investment-portfolio analytics web service for the Russian retail market
  (учёт акций и облигаций по нескольким счетам, P&L, дивиденды, ребалансировка,
  ИИ-аналитик). Use this when building any InvestAnalitic screen, prototype,
  marketing page or doc so output matches the brand: Golos Text + JetBrains Mono,
  cool-slate ink on paper, a single azure brand accent, hue-isolated P&L
  green/red, restrained violet for AI surfaces.
---

# InvestAnalitic Design System — Skill

## Start here
1. Read **`readme.md`** — full product context, content fundamentals (Russian
   voice, "ты", house number style `1 234 567,89 ₽` / `+12,34%`), visual
   foundations, iconography, and the file index.
2. Link the tokens in any HTML you build:
   ```html
   <link rel="stylesheet" href="<relpath>/styles.css">
   ```
   This pulls in webfonts + all token layers + base. Build with **semantic
   tokens** (`--text-1`, `--surface-card`, `--accent`, `--pnl-up`, …), never raw
   primitives.

## Using components
Components are React (JSX). The compiler bundles them to `_ds_bundle.js`, exposed
on `window.InvestAnaliticDesignSystem_81c80b`. In an HTML page:
```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="<relpath>/_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, StatCard, PnLValue, AIComposer } = window.InvestAnaliticDesignSystem_81c80b;
  // …render…
  setTimeout(() => window.lucide && window.lucide.createIcons(), 60);
</script>
```
Each component ships its own styling (token-built) and a `.prompt.md` with copy-paste
examples + a `.d.ts` with full prop docs — read those before using a component.

### Component map
- **forms/** — `Button`, `IconButton`, `Input` (set `numeric` for money), `Select`, `Switch`
- **data/** — `Card`, `StatCard`, `PnLValue` ⭐ (the signature gain/loss figure),
  `Badge`, `AllocationBar` (the primary "chart"), `Avatar` (broker tile)
- **navigation/** — `Tabs` (line / pill)
- **ai/** — `AIMessage` (conversation turn), `AIComposer` ⭐ (the persistent input
  that is the product's spine)

## Full reference
`ui_kits/app/index.html` is a working click-through of the whole product
(dashboard, AI analyst, rebalancing, dividend calendar) — copy its patterns for
the app shell, tables, and AI surfaces.

## Non-negotiables
- **Voice:** Russian, informal "ты", concrete figures from the user's own portfolio.
- **Numbers:** `1 234 567,89 ₽` (space thousands, comma decimal, symbol after);
  percents two decimals with explicit sign and true minus `+12,34%` / `−4,10%`;
  tickers/ISINs uppercase mono. Money columns use tabular figures (`.ia-num`).
- **Colour discipline:** azure = brand only; green/red = P&L only; violet = AI
  surfaces only; amber = warning. No gradients in chrome (only the AI composer glow).
- **Icons:** Lucide, ~2px stroke, `currentColor`. Emoji only as leading signal
  glyphs in AI proactive messages (📅 ⚖️ 🧾 ⚠️ 📌).
- Always add the analyst disclaimer where actions are proposed: *не индивидуальная
  инвестиционная рекомендация*.
