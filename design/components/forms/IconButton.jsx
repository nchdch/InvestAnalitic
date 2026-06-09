import React from 'react'
import { injectOnce } from '../_internal/style.js'

const CSS = `
.ia-iconbtn{
  display:inline-flex; align-items:center; justify-content:center;
  background:transparent; border:1px solid transparent; color:var(--text-2);
  border-radius:var(--radius-md); cursor:pointer; padding:0;
  transition:background var(--dur-fast) var(--ease-out),
             color var(--dur-fast) var(--ease-out),
             border-color var(--dur-fast) var(--ease-out),
             transform var(--dur-fast) var(--ease-out);
}
.ia-iconbtn:hover:not([disabled]){ background:var(--surface-sunken); color:var(--text-1); }
.ia-iconbtn:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-iconbtn:active{ transform:translateY(1px); }
.ia-iconbtn[disabled]{ opacity:.45; cursor:not-allowed; }
.ia-iconbtn svg,.ia-iconbtn i{ width:1.25em; height:1.25em; display:block; }

.ia-iconbtn--sm{ width:var(--control-sm); height:var(--control-sm); font-size:15px; }
.ia-iconbtn--md{ width:var(--control-md); height:var(--control-md); font-size:18px; }
.ia-iconbtn--lg{ width:var(--control-lg); height:var(--control-lg); font-size:20px; }

.ia-iconbtn--outlined{ border-color:var(--border-2); background:var(--surface-card); }
.ia-iconbtn--solid{ background:var(--accent); color:var(--text-on-accent); }
.ia-iconbtn--solid:hover:not([disabled]){ background:var(--accent-hover); color:var(--text-on-accent); }
`

/**
 * Square icon-only button (toolbar, table row actions, close).
 */
export function IconButton({
  size = 'md',
  variant = 'ghost',
  label,
  className = '',
  children,
  ...rest
}) {
  injectOnce('ia-iconbtn', CSS)
  const cls = [
    'ia-iconbtn',
    `ia-iconbtn--${size}`,
    variant !== 'ghost' ? `ia-iconbtn--${variant}` : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  )
}
