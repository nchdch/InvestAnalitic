# InvestAnalitic — Design System

> **AI-first учёт и анализ инвестиционного портфеля.** Веб-сервис для российских
> частных инвесторов: учёт акций и облигаций по нескольким брокерским счетам,
> P&L-аналитика, дивидендный календарь, ребалансировка — и ИИ-аналитик в центре
> продукта, который не просто показывает цифры, а интерпретирует их.

This file is the design guide **and** manifest. It describes the product context,
how copy is written, the visual foundations, and points to every token file,
component, UI kit and specimen card in the system.

---

## 1. Product context

**InvestAnalitic** is an AI-first alternative to **Intelinvest**, a leading Russian
investment-tracking tool. The pitch is explicit in the product brief: competitors
are *"таблицы, графики и формы"* (tables, charts, forms); InvestAnalitic is
*"разговор с умным аналитиком, который знает твой портфель досконально"* — a
conversation with a smart analyst who knows your portfolio inside out.

**The AI agent is the product**, not a side chatbot. The user enters trades in
free text ("Купил 5 лотов Сбера по 286"), asks questions, and the agent parses,
calculates, warns about risk and proposes concrete actions. It is **proactive** —
it surfaces upcoming dividends, rebalancing drift, tax-loss harvesting windows and
concentration risk without being asked.

### What it does (feature parity + the AI edge)
- Unified tracking of **equities + bonds** across multiple broker accounts
- **P&L** analytics: unrealized, realized, by period (day → all-time)
- **Dividend & coupon calendar** with forward yield
- **Rebalancing** to target weights, with buy/sell action lists
- **Multi-account / multi-currency**, everything normalized to a base currency (₽)
- Visual analytics: allocation, sector breakdown, yield dynamics
- An **AI analyst** layered over all of it — chat input, proactive signals, scenario analysis

### Data hierarchy (drives the main screen)
```
Портфель (общий)
├── Счёт: Сбер Инвестиции
│   ├── Акции  → [позиции]
│   ├── Облигации → [позиции]
│   └── Денежные средства → [остатки по валютам]
├── Счёт: Т-Банк Инвестиции
│   └── …
```

### Sources used to build this system
- **Codebase (read-only, mounted):** `InvestAnalitic/` — React 18 + TypeScript +
  Vite frontend, Express + TS backend, PostgreSQL. State via Zustand.
  - `InvestAnalitic/CLAUDE.md` — the full product/system-prompt brief (positioning,
    AI behaviour, screen structure, table column specs, copy examples). **Primary source.**
  - `InvestAnalitic/docs/architecture.md` — stack and folder responsibilities.
  - `InvestAnalitic/src/types/` — the domain model (`Account`, `Position`
    [`EquityPosition`/`BondPosition`], `Trade`, `Payment`, `PortfolioSummary`,
    `AccountSummary`, `EquityRow`, `BondRow`, `CashRow`). These types drive every
    component's data shape.
  - `InvestAnalitic/src/utils/format.ts` — the canonical money/percent formatters
    (`1 234 567,89 ₽`, `+12,34%`).
- **No Figma, no existing visual design.** `src/components`, `src/pages`,
  `src/styles`, `src/theme`, `src/assets` were all **empty** — the brief splits
  responsibilities so "Claude Design" owns the visual layer. This design system
  *is* that visual layer, created from scratch and grounded in the product brief
  and domain types. There is no prior brand to reverse-engineer.

---

## 2. Content fundamentals

How InvestAnalitic talks. The product is Russian-language; copy must read like a
sharp, trustworthy analyst — never a hype-y robot, never a stiff bank.

- **Language:** Russian (Cyrillic) throughout the product UI. English appears only
  in tickers (`SBER`, `LKOH`), ISINs and exchange codes (`MOEX`, `SPB`).
- **Address:** informal **"ты"**, not "вы". The brief's welcome line is
  *«Привет! Я твой инвестиционный ИИ-ассистент…»* and examples use "твой портфель",
  "твои позиции". The AI is a knowledgeable peer, not a butler.
- **Voice:** confident, concrete, numeric. Every claim is backed by a figure **from
  the user's own portfolio**, never an abstraction. *"LKOH занял 18,3% портфеля при
  цели 12%"* — not *"одна из ваших позиций выросла"*.
- **Brevity:** proactive messages are **2–4 lines, suti srazu** (point first). Each
  ends with a **call to action** as a question: *"Хотите посмотреть варианты
  ребалансировки?"*, *"Рассчитать варианты?"*
- **Casing:** sentence case for everything — headings, buttons, labels. No Title
  Case, no ALL CAPS except tiny overline/eyebrow micro-labels.
- **Numbers (non-negotiable house style):**
  - Thousands separated by a thin/regular space: **`1 234 567,89 ₽`**
  - Decimal comma, two places for money; currency symbol after the number + space.
  - Percentages: two decimals, explicit sign on deltas: **`+12,34%`**, **`−4,10%`**
    (true minus `−`, not hyphen).
  - Tickers and ISINs are uppercase, monospace.
- **Tone of analysis:** after any big calculation, add a short read — *что хорошо,
  что настораживает*. Offer options, never command; the final decision is the user's.
- **Honesty & limits:** the agent states when data is missing rather than guessing,
  and always carries the disclaimer that this is **не индивидуальная инвестиционная
  рекомендация** and tax figures are ориентировочные.
- **Emoji:** used **sparingly and only as signal glyphs in proactive notifications**
  — 📅 dividends/coupons, ⚖️ rebalancing, 🧾 tax, ⚠️ risk/concentration, 📌 bond
  maturity. One per message, leading the line. Never decorative, never in the core
  dashboard chrome. Prefer the Lucide icon set for UI; reserve emoji for the AI's
  conversational signals.

**Example copy (from the brief):**
- Welcome: *«Привет! Я твой инвестиционный ИИ-ассистент — аналог Intelinvest, но с
  умным агентом внутри. Давай начнём: добавь первую сделку в любой форме…»*
- Dividend nudge: *«📅 Через 4 дня SBER выплачивает дивиденд — ~12,50 ₽ на акцию.
  По вашей позиции ожидается ~6 250 ₽ до налогов.»*
- Risk: *«⚠️ GAZP занимает 28% портфеля. Высокая концентрация в одном эмитенте
  увеличивает риск. Рассмотреть диверсификацию?»*

---

## 3. Visual foundations

The product is a **precision instrument that feels warm** — dense and tabular like
a real portfolio tool, but calmer and more considered than a spreadsheet. Decisions:

- **Palette.** Cool slate **ink** neutrals on a near-white **paper** canvas. A single
  brand accent — **azure / cobalt blue** (`--accent`) — signals trust + intelligence
  and is the only "brand color." Crucially, **P&L green/red are hue-isolated from the
  brand**: `--pnl-up` is emerald, `--pnl-down` is red, and neither shares the azure
  hue, so a colored number is never mistaken for a brand element. Amber = warning.
  A restrained **violet** (`--ai`) marks AI-agent surfaces *only* (assistant message
  bubbles, the composer glow) — never used for generic UI. Full dark theme via
  `[data-theme="dark"]`.
- **Color vibe of imagery.** This is a data product — there is little photography.
  Where imagery appears (broker logos, empty-state spots) keep it flat, cool and
  restrained. No warm filters, no grain, no stock photos. The "imagery" is the data:
  allocation bars, figures, sparkline-style trends.
- **Type.** **Golos Text** (Cyrillic-native humanist grotesque) for all UI and
  display; **JetBrains Mono** for tickers, ISINs and money figures. Money and any
  tabular column **always** use tabular lining figures (`.ia-num` / `--num-tabular`)
  so kopecks line up. Big hero figures (portfolio total) use display size with tight
  tracking. No other families — two is the whole system.
- **Spacing.** 4px base grid, fine-grained at the small end (table padding lives at
  6–12px). Generous gutters around cards (`--space-9`), tight rhythm inside tables.
- **Layout rules.** App shell = fixed left **sidebar** (`--layout-sidebar`, 264px)
  + scrolling content capped at `--layout-max` (1280px). A persistent **AI composer**
  is docked (bottom of content or as a right rail) — it is the product's spine and is
  always reachable. Sticky table headers; sticky account headers on long lists.
- **Backgrounds.** Solid, flat surfaces — **no gradients** in chrome. The one
  permitted gradient/glow is a subtle azure or violet aura behind the **AI composer /
  focused brand moment** (`--shadow-accent`, `--shadow-ai`). No textures, no patterns,
  no full-bleed hero imagery.
- **Cards.** White (`--surface-card`) on the app canvas, **hairline border
  (`--border-1`) + a whisper of shadow** (`--shadow-sm`) — depth comes from the line,
  not a heavy drop shadow. Radius `--radius-lg` (12px); hero/feature cards
  `--radius-2xl`. Never a colored left-border-accent card (explicitly avoided).
- **Corner radii.** Controls 8px (`--radius-md`), cards 12px (`--radius-lg`), modals
  16px, pills/avatars/badges full. Consistent and soft, never sharp, never overly round.
- **Borders & dividers.** Hairlines do the heavy lifting: `--border-1` for default,
  `--border-2`/`--border-strong` for inputs and emphasis, `--divider` for in-card
  rules and table row lines.
- **Shadows.** Soft, **cool-tinted**, layered, low-contrast (`--shadow-xs` →
  `--shadow-xl`). Popovers/dropdowns use `--shadow-md`, modals `--shadow-lg`/`xl`.
  No inner shadows except inset focus where needed.
- **Transparency & blur.** Used only for overlay scrims (modal/sheet backdrop) and
  the occasional sticky-header fade. No glassmorphism in the core UI.
- **Hover states.** Subtle and fast: surfaces lift to a lighter fill or pick up
  `--shadow-sm`; primary buttons darken to `--accent-hover`; ghost/secondary pick up
  `--surface-sunken`. Links underline. Hover never shifts layout.
- **Press states.** A small `transform: translateY(1px)` / `scale(0.99)` + slightly
  deeper fill. Quick (`--dur-fast`).
- **Focus.** Always visible: a 3px `--focus-ring` (azure at ~35% alpha) via
  `box-shadow`, never `outline: none` with nothing in its place.
- **Motion.** Restrained and functional. Default `--dur-base` (180ms) with
  `--ease-out`; springs (`--ease-spring`) reserved for the AI agent's playful
  micro-moments (a new message settling in). **No infinite decorative loops.** A
  typing indicator and a value count-up are the extent of "animation." Everything
  respects `prefers-reduced-motion`.

---

## 4. Iconography

- **Primary set: [Lucide](https://lucide.dev)** — loaded from CDN
  (`https://unpkg.com/lucide@latest`). Clean 24×24, **1.75–2px stroke**, rounded
  joins. It matches the calm, precise tone and has full coverage for a fintech
  dashboard (wallet, trending-up/down, scale, calendar, bell, sparkles for AI,
  arrow-up-right/down-right for P&L, plus, search, settings, etc.).
  **⚠️ Substitution flag:** the codebase shipped **no icon set** (`src/assets` was
  empty), so Lucide is a chosen substitution, not a recovered asset. If the team
  adopts a different set, swap the CDN link and re-document here.
- **Default stroke:** `2px`, `currentColor`, so icons inherit text color and P&L
  semantics for free (an up-arrow in `--pnl-up`, a warning in `--warning`).
- **Sizing:** 16px inline with text, 18–20px in buttons, 24px standalone. Hit
  targets ≥ 40px even when the glyph is 16px.
- **SVG vs font:** use inline SVG (Lucide's `data-lucide` + `lucide.createIcons()`),
  not an icon font. Never hand-draw bespoke icons — pull from Lucide.
- **Emoji:** **not** part of the icon system. They appear only as leading signal
  glyphs inside AI proactive notifications (see Content fundamentals): 📅 ⚖️ 🧾 ⚠️ 📌.
- **Unicode glyphs:** the true minus `−` (U+2212) for negative figures, the ruble
  `₽`, thin space for thousands. Arrows in copy use Lucide, not unicode.
- **Brand mark:** `assets/logo.svg` (full lockup) and `assets/logo-mark.svg` (the
  standalone monogram/spark mark). See `assets/README.md`. These are an original,
  minimal geometric wordmark created for the system — **placeholder identity**, easy
  to replace if the team commissions a logo.

---

## 5. Index / manifest

### Root
| File | Purpose |
|---|---|
| `styles.css` | **Entry point.** `@import` manifest only — consumers link this. |
| `readme.md` | This guide + manifest. |
| `SKILL.md` | Agent-Skill wrapper (works in Claude Code). |

### Tokens (`tokens/`, all reached from `styles.css`)
| File | Contents |
|---|---|
| `fonts.css` | `@import` of Golos Text + JetBrains Mono (Google Fonts). |
| `colors.css` | Primitive scales + semantic roles; light + `[data-theme="dark"]`. |
| `typography.css` | Families, weights, type scale, tracking, numeric helper. |
| `spacing.css` | 4px spacing ramp, radii, control heights, layout sizes. |
| `elevation.css` | Shadows, focus ring, motion easings/durations, z-index. |
| `base.css` | Element defaults + brand utilities (`.ia-num`, `.ia-mono`, `.ia-eyebrow`, `.ia-up/down/flat`). |

### Specimen cards (`guidelines/`) — populate the Design System tab
Typography, color (primary / neutral / semantic / P&L), spacing, radii, shadows,
elevation — small HTML cards, each linking `styles.css`.

### Components (`components/`) — see each dir's `*.prompt.md` + `.d.ts`
`forms/` (Button, IconButton, Input, Select, Switch) ·
`data/` (Card, StatCard, Badge, Tag, PnLValue, AllocationBar, Avatar) ·
`navigation/` (Tabs) · `ai/` (AIMessage, AIComposer).

### UI kit (`ui_kits/app/`)
Full click-through recreation of the product: portfolio dashboard, AI assistant
chat, rebalancing, dividend calendar. `index.html` is the interactive demo.

### Assets (`assets/`)
`logo.svg`, `logo-mark.svg`, broker logos, brand specimen. See `assets/README.md`.

---

*Built by Claude Design from the `InvestAnalitic/` codebase brief. No prior brand
existed; the visual language here is original and grounded in the product's
"smart analyst" positioning.*
