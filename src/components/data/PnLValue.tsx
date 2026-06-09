import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-pnl{
  display:inline-flex; align-items:center; gap:4px;
  font-family:var(--font-mono); font-variant-numeric:tabular-nums lining-nums;
  font-weight:var(--fw-semibold); line-height:1; white-space:nowrap;
}
.ia-pnl--up{ color:var(--pnl-up); }
.ia-pnl--down{ color:var(--pnl-down); }
.ia-pnl--flat{ color:var(--pnl-flat); }
.ia-pnl__arrow{ width:0.85em; height:0.85em; flex:none; }
.ia-pnl--sm{ font-size:var(--text-sm); }
.ia-pnl--md{ font-size:var(--text-base); }
.ia-pnl--lg{ font-size:var(--text-h4); }
.ia-pnl--xl{ font-size:var(--text-h2); letter-spacing:var(--tracking-snug); }
.ia-pnl__pct{ opacity:.95; }
.ia-pnl--badge{ font-family:var(--font-mono); border-radius:var(--radius-sm); padding:2px 7px; gap:3px; }
.ia-pnl--badge.ia-pnl--up{ background:var(--pnl-up-soft); }
.ia-pnl--badge.ia-pnl--down{ background:var(--pnl-down-soft); }
.ia-pnl--badge.ia-pnl--flat{ background:var(--surface-sunken); }
`

const RUB = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const PCT = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ArrowUp = () => (
  <svg className="ia-pnl__arrow" viewBox="0 0 12 12" fill="none">
    <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ArrowDown = () => (
  <svg className="ia-pnl__arrow" viewBox="0 0 12 12" fill="none">
    <path d="M6 2.5v7M6 9.5L2.5 6M6 9.5L9.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function fmtMoney(v: number) {
  return `${v < 0 ? '−' : ''}${RUB.format(Math.abs(v))} ₽`
}
function fmtPct(v: number) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${PCT.format(Math.abs(v))}%`
}

export interface PnLValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: number
  percent?: number | null
  display?: 'money' | 'percent' | 'both'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  arrow?: boolean
  badge?: boolean
  showSignWhenZero?: boolean
}

export function PnLValue({
  value = 0,
  percent = null,
  display = 'both',
  size = 'md',
  arrow = true,
  badge = false,
  showSignWhenZero = false,
  className = '',
  ...rest
}: PnLValueProps) {
  injectOnce('ia-pnl', CSS)
  const basis = percent != null ? percent : value
  const dir = basis > 0 ? 'up' : basis < 0 ? 'down' : 'flat'
  const cls = [
    'ia-pnl', `ia-pnl--${dir}`, `ia-pnl--${size}`,
    badge ? 'ia-pnl--badge' : '', className,
  ].filter(Boolean).join(' ')
  const showArrow = arrow && (dir !== 'flat' || showSignWhenZero)
  return (
    <span className={cls} {...rest}>
      {showArrow && dir === 'up' && <ArrowUp />}
      {showArrow && dir === 'down' && <ArrowDown />}
      {(display === 'money' || display === 'both') && <span>{fmtMoney(value)}</span>}
      {(display === 'percent' || display === 'both') && percent != null && (
        <span className="ia-pnl__pct">{display === 'both' ? `(${fmtPct(percent)})` : fmtPct(percent)}</span>
      )}
    </span>
  )
}
