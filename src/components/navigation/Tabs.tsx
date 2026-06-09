import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-tabs{ display:flex; align-items:center; gap:2px; font-family:var(--font-sans); }
.ia-tabs--line{ border-bottom:1px solid var(--border-1); gap:4px; }
.ia-tabs--pill{ background:var(--surface-sunken); padding:3px; border-radius:var(--radius-md); gap:2px; width:max-content; }
.ia-tab{
  appearance:none; border:0; background:transparent; cursor:pointer;
  font-family:inherit; font-size:var(--text-sm); font-weight:var(--fw-medium);
  color:var(--text-3); padding:8px 14px; border-radius:var(--radius-sm);
  display:inline-flex; align-items:center; gap:7px; white-space:nowrap;
  transition:color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.ia-tab:hover{ color:var(--text-1); }
.ia-tab:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-tab svg,.ia-tab i{ width:16px; height:16px; }
.ia-tab__count{ font-family:var(--font-mono); font-size:var(--text-2xs); color:var(--text-4); background:var(--surface-sunken); border-radius:var(--radius-pill); padding:1px 6px; }
.ia-tabs--line .ia-tab{ border-radius:0; padding:10px 4px; margin-bottom:-1px; border-bottom:2px solid transparent; }
.ia-tabs--line .ia-tab--active{ color:var(--accent); border-bottom-color:var(--accent); }
.ia-tabs--pill .ia-tab--active{ color:var(--text-1); background:var(--surface-card); box-shadow:var(--shadow-xs); }
.ia-tabs--pill .ia-tab__count{ background:var(--surface-sunken); }
`

export interface TabItem {
  value: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items?: TabItem[]
  value?: string
  onChange?: (value: string) => void
  variant?: 'line' | 'pill'
}

export function Tabs({
  items = [],
  value,
  onChange,
  variant = 'line',
  className = '',
  ...rest
}: TabsProps) {
  injectOnce('ia-tabs', CSS)
  return (
    <div className={['ia-tabs', `ia-tabs--${variant}`, className].filter(Boolean).join(' ')} role="tablist" {...rest}>
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={['ia-tab', active ? 'ia-tab--active' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange?.(it.value)}
          >
            {it.icon}
            {it.label}
            {it.count != null && <span className="ia-tab__count">{it.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
