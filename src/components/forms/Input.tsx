import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-field{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); }
.ia-field__label{ font-size:var(--text-sm); font-weight:var(--fw-medium); color:var(--text-2); }
.ia-field__req{ color:var(--negative); margin-left:2px; }
.ia-input-wrap{
  display:flex; align-items:center; gap:8px; background:var(--surface-card);
  border:1px solid var(--border-2); border-radius:var(--radius-md);
  padding:0 12px; height:var(--control-md);
  transition:border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.ia-input-wrap--sm{ height:var(--control-sm); }
.ia-input-wrap--lg{ height:var(--control-lg); }
.ia-input-wrap:focus-within{ border-color:var(--accent); box-shadow:var(--ring); }
.ia-input-wrap--invalid{ border-color:var(--negative); }
.ia-input-wrap--invalid:focus-within{ box-shadow:0 0 0 var(--ring-width) var(--negative-soft); }
.ia-input-wrap--disabled{ background:var(--surface-sunken); opacity:.7; cursor:not-allowed; }
.ia-input{
  flex:1; min-width:0; border:0; outline:none; background:transparent;
  font-family:inherit; font-size:var(--text-base); color:var(--text-1); height:100%;
}
.ia-input::placeholder{ color:var(--text-4); }
.ia-input--num{ font-family:var(--font-mono); font-variant-numeric:tabular-nums; text-align:right; }
.ia-input-wrap__affix{ color:var(--text-3); font-size:var(--text-sm); display:inline-flex; align-items:center; }
.ia-field__hint{ font-size:var(--text-xs); color:var(--text-3); }
.ia-field__hint--err{ color:var(--negative); }
`

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  hint?: string
  error?: string
  numeric?: boolean
}

export function Input({
  label,
  required = false,
  size = 'md',
  prefix = null,
  suffix = null,
  hint = '',
  error = '',
  numeric = false,
  disabled = false,
  id,
  className = '',
  ...rest
}: InputProps) {
  injectOnce('ia-input', CSS)
  const fid = id || (label ? `ia-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)
  const invalid = Boolean(error)
  const wrapCls = [
    'ia-input-wrap',
    `ia-input-wrap--${size}`,
    invalid ? 'ia-input-wrap--invalid' : '',
    disabled ? 'ia-input-wrap--disabled' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={['ia-field', className].filter(Boolean).join(' ')}>
      {label && (
        <label className="ia-field__label" htmlFor={fid}>
          {label}{required && <span className="ia-field__req">*</span>}
        </label>
      )}
      <div className={wrapCls}>
        {prefix && <span className="ia-input-wrap__affix">{prefix}</span>}
        <input
          id={fid}
          className={['ia-input', numeric ? 'ia-input--num' : ''].filter(Boolean).join(' ')}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          inputMode={numeric ? 'decimal' : undefined}
          {...rest}
        />
        {suffix && <span className="ia-input-wrap__affix">{suffix}</span>}
      </div>
      {(hint || error) && (
        <span className={['ia-field__hint', invalid ? 'ia-field__hint--err' : ''].filter(Boolean).join(' ')}>
          {error || hint}
        </span>
      )}
    </div>
  )
}
