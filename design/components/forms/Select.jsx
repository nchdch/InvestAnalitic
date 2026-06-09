import React from 'react'
import { injectOnce } from '../_internal/style.js'

const CSS = `
.ia-select{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); }
.ia-select__label{ font-size:var(--text-sm); font-weight:var(--fw-medium); color:var(--text-2); }
.ia-select__wrap{ position:relative; display:flex; align-items:center; }
.ia-select__el{
  appearance:none; -webkit-appearance:none; width:100%; cursor:pointer;
  font-family:inherit; font-size:var(--text-base); color:var(--text-1);
  background:var(--surface-card); border:1px solid var(--border-2);
  border-radius:var(--radius-md); height:var(--control-md); padding:0 36px 0 12px;
  transition:border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.ia-select__el--sm{ height:var(--control-sm); font-size:var(--text-sm); }
.ia-select__el--lg{ height:var(--control-lg); }
.ia-select__el:focus-visible{ outline:none; border-color:var(--accent); box-shadow:var(--ring); }
.ia-select__el:disabled{ background:var(--surface-sunken); opacity:.7; cursor:not-allowed; }
.ia-select__chev{
  position:absolute; right:12px; pointer-events:none; color:var(--text-3);
  width:16px; height:16px; display:flex; align-items:center; justify-content:center;
}
.ia-select__chev svg{ width:16px; height:16px; }
`

const Chevron = () => (
  <span className="ia-select__chev" aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </span>
)

/**
 * Native select wrapped with the system's field chrome and a custom chevron.
 * Pass `options` (array of {value,label}) or children <option>s.
 */
export function Select({
  label,
  size = 'md',
  options = null,
  placeholder,
  id,
  className = '',
  children,
  ...rest
}) {
  injectOnce('ia-select', CSS)
  const fid = id || (label ? `ia-sel-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)
  return (
    <div className={['ia-select', className].filter(Boolean).join(' ')}>
      {label && <label className="ia-select__label" htmlFor={fid}>{label}</label>}
      <div className="ia-select__wrap">
        <select id={fid} className={`ia-select__el ia-select__el--${size}`} {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options
            ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
        <Chevron />
      </div>
    </div>
  )
}
