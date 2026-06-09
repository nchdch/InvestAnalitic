import React from 'react'
import { injectOnce } from '../_internal/style.js'

const CSS = `
.ia-composer{ font-family:var(--font-sans); width:100%; }
.ia-composer__shell{
  position:relative; background:var(--surface-card);
  border:1px solid var(--border-2); border-radius:var(--radius-xl);
  box-shadow:var(--shadow-sm);
  transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.ia-composer__shell:focus-within{ border-color:var(--accent); box-shadow:var(--shadow-accent); }
.ia-composer__row{ display:flex; align-items:flex-end; gap:10px; padding:10px 10px 10px 16px; }
.ia-composer__spark{
  flex:none; width:30px; height:30px; border-radius:var(--radius-pill); margin-bottom:5px;
  display:flex; align-items:center; justify-content:center; color:#fff;
  background:linear-gradient(135deg, var(--violet-500), var(--azure-500));
}
.ia-composer__spark svg{ width:17px; height:17px; }
.ia-composer__input{
  flex:1; min-width:0; border:0; outline:none; background:transparent; resize:none;
  font-family:inherit; font-size:var(--text-base); line-height:1.5; color:var(--text-1);
  padding:6px 0; max-height:160px; min-height:24px;
}
.ia-composer__input::placeholder{ color:var(--text-4); }
.ia-composer__send{
  flex:none; width:38px; height:38px; border:0; border-radius:var(--radius-md); cursor:pointer;
  background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center;
  transition:background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out);
}
.ia-composer__send:hover:not(:disabled){ background:var(--accent-hover); }
.ia-composer__send:active{ transform:translateY(1px); }
.ia-composer__send:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-composer__send:disabled{ opacity:.4; cursor:not-allowed; }
.ia-composer__send svg{ width:18px; height:18px; }
.ia-composer__suggest{ display:flex; gap:8px; flex-wrap:wrap; padding:0 12px 12px; }
.ia-composer__chip{
  appearance:none; border:1px solid var(--border-1); background:var(--surface-sunken); cursor:pointer;
  font-family:inherit; font-size:var(--text-sm); color:var(--text-2);
  padding:6px 12px; border-radius:var(--radius-pill); white-space:nowrap;
  transition:background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.ia-composer__chip:hover{ background:var(--accent-soft); color:var(--accent-hover); border-color:var(--azure-200); }
.ia-composer__hint{ font-size:var(--text-2xs); color:var(--text-4); padding:0 16px 10px; }
`

const Spark = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" fill="currentColor"/></svg>)
const SendIcon = () => (<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)

/**
 * The persistent AI input — the product's spine. A spark-marked text area with
 * a send button, optional suggestion chips and a hint. Uncontrolled by default;
 * call `onSend(text)` on Enter / send click. Shift+Enter inserts a newline.
 */
export function AIComposer({
  placeholder = 'Спроси аналитика или добавь сделку: «Купил 5 лотов Сбера по 286»',
  suggestions = [],
  onSend,
  onSuggestion,
  hint = 'Enter — отправить · Shift+Enter — новая строка',
  disabled = false,
  className = '',
  ...rest
}) {
  injectOnce('ia-composer', CSS)
  const ref = React.useRef(null)
  const [val, setVal] = React.useState('')

  const grow = (el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }
  const submit = () => {
    const text = val.trim()
    if (!text || disabled) return
    onSend && onSend(text)
    setVal('')
    if (ref.current) ref.current.style.height = 'auto'
  }
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div className={['ia-composer', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ia-composer__shell">
        <div className="ia-composer__row">
          <span className="ia-composer__spark"><Spark /></span>
          <textarea
            ref={ref}
            className="ia-composer__input"
            rows={1}
            placeholder={placeholder}
            value={val}
            disabled={disabled}
            onChange={(e) => { setVal(e.target.value); grow(e.target) }}
            onKeyDown={onKey}
          />
          <button type="button" className="ia-composer__send" onClick={submit} disabled={disabled || !val.trim()} aria-label="Отправить">
            <SendIcon />
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="ia-composer__suggest">
            {suggestions.map((s, i) => (
              <button key={i} type="button" className="ia-composer__chip"
                onClick={() => onSuggestion ? onSuggestion(s) : (onSend && onSend(s))}>
                {s}
              </button>
            ))}
          </div>
        )}
        {hint && <div className="ia-composer__hint">{hint}</div>}
      </div>
    </div>
  )
}
