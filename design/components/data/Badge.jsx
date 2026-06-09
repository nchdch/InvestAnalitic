import React from 'react'
import { injectOnce } from '../_internal/style.js'

const CSS = `
.ia-badge{
  display:inline-flex; align-items:center; gap:4px; font-family:var(--font-sans);
  font-size:var(--text-xs); font-weight:var(--fw-semibold); line-height:1;
  padding:4px 8px; border-radius:var(--radius-sm); white-space:nowrap;
}
.ia-badge--sm{ font-size:var(--text-2xs); padding:3px 6px; }
.ia-badge svg,.ia-badge i{ width:1em; height:1em; }
.ia-badge__dot{ width:6px; height:6px; border-radius:50%; background:currentColor; }
.ia-badge--neutral{ background:var(--surface-sunken); color:var(--text-2); }
.ia-badge--accent{ background:var(--accent-soft); color:var(--accent-hover); }
.ia-badge--positive{ background:var(--positive-soft); color:var(--positive); }
.ia-badge--negative{ background:var(--negative-soft); color:var(--negative); }
.ia-badge--warning{ background:var(--warning-soft); color:var(--amber-600); }
.ia-badge--ai{ background:var(--ai-soft); color:var(--ai); }
.ia-badge--outline{ background:transparent; box-shadow:inset 0 0 0 1px var(--border-2); color:var(--text-2); }
`

/**
 * Small status pill. Tones map to semantic roles; `dot` shows a leading status dot.
 */
export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  children,
  ...rest
}) {
  injectOnce('ia-badge', CSS)
  const cls = ['ia-badge', `ia-badge--${tone}`, size === 'sm' ? 'ia-badge--sm' : '', className].filter(Boolean).join(' ')
  return (
    <span className={cls} {...rest}>
      {dot && <span className="ia-badge__dot" />}
      {icon}
      {children}
    </span>
  )
}
