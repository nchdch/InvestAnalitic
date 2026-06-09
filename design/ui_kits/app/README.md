# InvestAnalitic — UI Kit

A working click-through recreation of the product, built entirely on the design
system (`../../styles.css` tokens + `../../_ds_bundle.js` components).

Open **`index.html`**. Four screens via the sidebar:

| Screen | What it shows |
|---|---|
| **Портфель** | Portfolio summary (hero total + P&L + allocation), the AI "аналитик заметил" signal rail, and the positions table (Акции / Облигации / Деньги tabs) with per-row P&L, weights and YTM. |
| **ИИ-аналитик** | The conversation surface — `AIMessage` turns + the persistent `AIComposer`. Type a message to see the typing indicator + a stub reply. |
| **Ребалансировка** | Current-vs-target weight bars and the generated buy/sell plan, with the analyst disclaimer. |
| **Выплаты** | Dividend & coupon calendar with forward-yield stats and paid/upcoming status. |

### Files
- `index.html` — entry + app composition (also a registered **starting point**).
- `app.css` — layout chrome (sidebar, topbar, tables, chat, rebalance) on DS tokens.
- `shell.jsx` — `Sidebar`, `Topbar`, the `Icon` helper, shared exports (`window.IAKit`).
- `screens.jsx` — the four screens + tables (`window.IAScreens`).
- `data.js` — demo portfolio data in the house number style (`window.IA_DATA`).

All numbers are illustrative demo data. Swap `data.js` for live data shaped like
`InvestAnalitic/src/types/` (`EquityRow`, `BondRow`, `Payment`, `PortfolioSummary`).
