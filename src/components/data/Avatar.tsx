import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-avatar{
  display:inline-flex; align-items:center; justify-content:center; flex:none;
  font-family:var(--font-sans); font-weight:var(--fw-bold); color:#fff;
  border-radius:var(--radius-md); overflow:hidden; user-select:none; line-height:1;
}
.ia-avatar--circle{ border-radius:var(--radius-pill); }
.ia-avatar--sm{ width:28px; height:28px; font-size:11px; }
.ia-avatar--md{ width:38px; height:38px; font-size:14px; }
.ia-avatar--lg{ width:48px; height:48px; font-size:18px; }
.ia-avatar img{ width:100%; height:100%; object-fit:cover; }
`

const TILE = [
  'var(--azure-600)', 'var(--violet-600)', 'var(--ink-600)',
  'var(--azure-700)', 'var(--gain-700)', 'var(--amber-600)',
]

function pick(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return TILE[h % TILE.length]
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]).join('').toUpperCase() || '?'
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string
  src?: string | null
  shape?: 'square' | 'circle'
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export function Avatar({
  name = '',
  src = null,
  shape = 'square',
  size = 'md',
  color,
  className = '',
  ...rest
}: AvatarProps) {
  injectOnce('ia-avatar', CSS)
  const cls = [
    'ia-avatar', `ia-avatar--${size}`,
    shape === 'circle' ? 'ia-avatar--circle' : '', className,
  ].filter(Boolean).join(' ')
  return (
    <span
      className={cls}
      style={{ background: src ? 'var(--surface-sunken)' : (color || pick(name)) }}
      title={name}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  )
}
