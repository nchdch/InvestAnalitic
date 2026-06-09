import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-btn{
  --_bg:var(--accent); --_fg:var(--text-on-accent); --_bd:transparent;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:var(--font-sans); font-weight:var(--fw-semibold);
  border:1px solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-md); cursor:pointer; white-space:nowrap;
  text-decoration:none; user-select:none; line-height:1;
  transition:background var(--dur-fast) var(--ease-out),
             border-color var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out),
             transform var(--dur-fast) var(--ease-out);
}
.ia-btn:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-btn:active{ transform:translateY(1px); }
.ia-btn[disabled],.ia-btn[aria-disabled="true"]{ opacity:.5; cursor:not-allowed; transform:none; }
.ia-btn--sm{ height:var(--control-sm); padding:0 12px; font-size:var(--text-sm); }
.ia-btn--md{ height:var(--control-md); padding:0 16px; font-size:var(--text-base); }
.ia-btn--lg{ height:var(--control-lg); padding:0 22px; font-size:var(--text-lg); }
.ia-btn--block{ width:100%; }
.ia-btn--primary{ --_bg:var(--accent); --_fg:var(--text-on-accent); }
.ia-btn--primary:hover:not([disabled]){ --_bg:var(--accent-hover); }
.ia-btn--secondary{ --_bg:var(--surface-card); --_fg:var(--text-1); --_bd:var(--border-2); }
.ia-btn--secondary:hover:not([disabled]){ background:var(--surface-sunken); }
.ia-btn--ghost{ --_bg:transparent; --_fg:var(--text-2); }
.ia-btn--ghost:hover:not([disabled]){ background:var(--surface-sunken); --_fg:var(--text-1); }
.ia-btn--soft{ --_bg:var(--accent-soft); --_fg:var(--accent-hover); }
.ia-btn--soft:hover:not([disabled]){ --_bg:var(--accent-soft-hover); }
.ia-btn--danger{ --_bg:var(--negative); --_fg:#fff; }
.ia-btn--danger:hover:not([disabled]){ filter:brightness(0.94); }
.ia-btn__spin{ width:1em; height:1em; border:2px solid currentColor; border-right-color:transparent;
  border-radius:50%; animation:ia-btn-spin .6s linear infinite; }
@keyframes ia-btn-spin{ to{ transform:rotate(360deg); } }
@media (prefers-reduced-motion: reduce){ .ia-btn__spin{ animation-duration:1.2s; } }
`

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  injectOnce('ia-btn', CSS)
  const cls = [
    'ia-btn',
    `ia-btn--${variant}`,
    `ia-btn--${size}`,
    block ? 'ia-btn--block' : '',
    className,
  ].filter(Boolean).join(' ')
  const isDisabled = disabled || loading
  return (
    <button type={rest.type ?? 'button'} className={cls} disabled={isDisabled} {...rest}>
      {loading && <span className="ia-btn__spin" aria-hidden="true" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
