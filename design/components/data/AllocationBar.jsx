import React from 'react'
import { injectOnce } from '../_internal/style.js'

const CSS = `
.ia-alloc{ display:flex; flex-direction:column; gap:8px; font-family:var(--font-sans); width:100%; }
.ia-alloc__bar{ display:flex; width:100%; height:10px; border-radius:var(--radius-pill); overflow:hidden; background:var(--surface-sunken); }
.ia-alloc__bar--lg{ height:14px; }
.ia-alloc__seg{ height:100%; transition:width var(--dur-slow) var(--ease-out); }
.ia-alloc__seg:first-child{ border-top-left-radius:var(--radius-pill); border-bottom-left-radius:var(--radius-pill); }
.ia-alloc__seg:last-child{ border-top-right-radius:var(--radius-pill); border-bottom-right-radius:var(--radius-pill); }
.ia-alloc__legend{ display:flex; flex-wrap:wrap; gap:6px 16px; }
.ia-alloc__item{ display:flex; align-items:center; gap:7px; font-size:var(--text-sm); color:var(--text-2); }
.ia-alloc__swatch{ width:9px; height:9px; border-radius:3px; flex:none; }
.ia-alloc__name{ color:var(--text-1); font-weight:var(--fw-medium); }
.ia-alloc__pct{ font-family:var(--font-mono); font-variant-numeric:tabular-nums; color:var(--text-3); margin-left:auto; }
.ia-alloc__item--inline .ia-alloc__pct{ margin-left:4px; }
`

const PALETTE = [
  'var(--azure-500)',
  'var(--gain-500)',
  'var(--violet-500)',
  'var(--amber-500)',
  'var(--azure-300)',
  'var(--ink-400)',
  'var(--loss-500)',
  'var(--gain-700)',
]

const PCT = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Horizontal stacked allocation bar + legend. Feed `segments` of {label,value}
 * (values are summed and normalised to %). For portfolio/sector/account weights.
 */
export function AllocationBar({
  segments = [],
  size = 'md',
  showLegend = true,
  className = '',
  ...rest
}) {
  injectOnce('ia-alloc', CSS)
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1
  const withPct = segments.map((s, i) => ({
    ...s,
    pct: (s.value / total) * 100,
    color: s.color || PALETTE[i % PALETTE.length],
  }))
  return (
    <div className={['ia-alloc', className].filter(Boolean).join(' ')} {...rest}>
      <div className={['ia-alloc__bar', size === 'lg' ? 'ia-alloc__bar--lg' : ''].filter(Boolean).join(' ')}>
        {withPct.map((s, i) => (
          <div key={i} className="ia-alloc__seg" style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label}: ${PCT.format(s.pct)}%`} />
        ))}
      </div>
      {showLegend && (
        <div className="ia-alloc__legend">
          {withPct.map((s, i) => (
            <span key={i} className="ia-alloc__item">
              <span className="ia-alloc__swatch" style={{ background: s.color }} />
              <span className="ia-alloc__name">{s.label}</span>
              <span className="ia-alloc__pct">{PCT.format(s.pct)}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
