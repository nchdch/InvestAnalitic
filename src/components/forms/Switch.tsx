import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-switch{ display:inline-flex; align-items:center; gap:10px; cursor:pointer; font-family:var(--font-sans); }
.ia-switch--disabled{ opacity:.5; cursor:not-allowed; }
.ia-switch__track{
  position:relative; width:38px; height:22px; flex:none; border-radius:var(--radius-pill);
  background:var(--ink-300); transition:background var(--dur-base) var(--ease-out);
}
.ia-switch__track--lg{ width:46px; height:26px; }
.ia-switch__thumb{
  position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%;
  background:var(--white); box-shadow:var(--shadow-sm);
  transition:transform var(--dur-base) var(--ease-spring);
}
.ia-switch__track--lg .ia-switch__thumb{ width:22px; height:22px; }
.ia-switch input{ position:absolute; opacity:0; width:0; height:0; }
.ia-switch input:checked + .ia-switch__track{ background:var(--accent); }
.ia-switch input:checked + .ia-switch__track .ia-switch__thumb{ transform:translateX(16px); }
.ia-switch input:checked + .ia-switch__track--lg .ia-switch__thumb{ transform:translateX(20px); }
.ia-switch input:focus-visible + .ia-switch__track{ box-shadow:var(--ring); }
.ia-switch__label{ font-size:var(--text-base); color:var(--text-1); }
`

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string
  size?: 'md' | 'lg'
}

export function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  id,
  className = '',
  ...rest
}: SwitchProps) {
  injectOnce('ia-switch', CSS)
  const trackCls = ['ia-switch__track', size === 'lg' ? 'ia-switch__track--lg' : ''].filter(Boolean).join(' ')
  return (
    <label className={['ia-switch', disabled ? 'ia-switch--disabled' : '', className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        id={id}
        {...rest}
      />
      <span className={trackCls}><span className="ia-switch__thumb" /></span>
      {label && <span className="ia-switch__label">{label}</span>}
    </label>
  )
}
