import React from 'react'
import { injectOnce } from '../_internal/style.js'
import { PnLValue } from './PnLValue.jsx'

const CSS = `
.ia-stat{
  display:flex; flex-direction:column; gap:6px;
  font-family:var(--font-sans);
}
.ia-stat__label{ display:flex; align-items:center; gap:6px; font-size:var(--text-sm); color:var(--text-3); font-weight:var(--fw-medium); }
.ia-stat__label svg,.ia-stat__label i{ width:15px; height:15px; }
.ia-stat__value{
  font-family:var(--font-mono); font-variant-numeric:tabular-nums lining-nums;
  font-weight:var(--fw-bold); color:var(--text-1); line-height:1.05; letter-spacing:var(--tracking-snug);
}
.ia-stat--sm .ia-stat__value{ font-size:var(--text-h3); }
.ia-stat--md .ia-stat__value{ font-size:var(--text-h2); }
.ia-stat--lg .ia-stat__value{ font-size:var(--text-h1); letter-spacing:var(--tracking-tight); }
.ia-stat--xl .ia-stat__value{ font-size:var(--text-display); letter-spacing:var(--tracking-tight); }
.ia-stat__foot{ display:flex; align-items:center; gap:8px; font-size:var(--text-sm); color:var(--text-3); }
.ia-stat__unit{ font-size:0.6em; font-weight:var(--fw-semibold); color:var(--text-3); margin-left:4px; }
`

/**
 * Headline metric: small label, large tabular figure, optional P&L delta and
 * caption. Use for the portfolio total and account/section summaries.
 */
export function StatCard({
  label,
  value,
  unit = '',
  icon = null,
  delta = null,           // number → rendered as PnLValue
  deltaPercent = null,
  caption = '',
  size = 'md',
  className = '',
  ...rest
}) {
  injectOnce('ia-stat', CSS)
  return (
    <div className={['ia-stat', `ia-stat--${size}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="ia-stat__label">{icon}{label}</span>
      <span className="ia-stat__value">
        {value}{unit && <span className="ia-stat__unit">{unit}</span>}
      </span>
      {(delta != null || deltaPercent != null || caption) && (
        <span className="ia-stat__foot">
          {(delta != null || deltaPercent != null) && (
            <PnLValue
              value={delta ?? 0}
              percent={deltaPercent}
              display={delta != null ? 'both' : 'percent'}
              size="sm"
            />
          )}
          {caption && <span>{caption}</span>}
        </span>
      )}
    </div>
  )
}
