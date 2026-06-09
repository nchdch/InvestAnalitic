import React from 'react'
import { injectOnce } from '../_internal/style.js'

const CSS = `
.ia-msg{ display:flex; gap:12px; font-family:var(--font-sans); max-width:760px; }
.ia-msg--user{ flex-direction:row-reverse; margin-left:auto; }
.ia-msg__avatar{
  flex:none; width:34px; height:34px; border-radius:var(--radius-pill);
  display:flex; align-items:center; justify-content:center;
}
.ia-msg__avatar--ai{ background:linear-gradient(135deg, var(--violet-500), var(--azure-500)); color:#fff; box-shadow:var(--shadow-ai); }
.ia-msg__avatar--ai svg,.ia-msg__avatar--ai i{ width:18px; height:18px; }
.ia-msg__avatar--user{ background:var(--surface-sunken); color:var(--text-2); font-weight:var(--fw-bold); font-size:13px; }
.ia-msg__body{ display:flex; flex-direction:column; gap:8px; min-width:0; }
.ia-msg__bubble{
  font-size:var(--text-base); line-height:var(--text-base-lh); color:var(--text-1);
  padding:12px 15px; border-radius:var(--radius-lg);
}
.ia-msg--ai .ia-msg__bubble{ background:var(--surface-ai); border:1px solid var(--ai-soft); border-top-left-radius:var(--radius-xs); }
.ia-msg--user .ia-msg__bubble{ background:var(--accent); color:var(--text-on-accent); border-top-right-radius:var(--radius-xs); }
.ia-msg__bubble p{ margin:0 0 8px; }
.ia-msg__bubble p:last-child{ margin:0; }
.ia-msg__bubble strong{ font-weight:var(--fw-semibold); }
.ia-msg__name{ display:flex; align-items:center; gap:7px; font-size:var(--text-xs); color:var(--text-3); font-weight:var(--fw-semibold); }
.ia-msg__name svg{ width:13px; height:13px; flex:none; color:var(--ai); }
.ia-msg--user .ia-msg__name{ flex-direction:row-reverse; }
.ia-msg__actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top:2px; }

/* typing indicator */
.ia-msg__typing{ display:inline-flex; gap:4px; align-items:center; padding:14px 16px; }
.ia-msg__typing span{ width:7px; height:7px; border-radius:50%; background:var(--ai); opacity:.4; animation:ia-typing 1.2s var(--ease-in-out) infinite; }
.ia-msg__typing span:nth-child(2){ animation-delay:.18s; }
.ia-msg__typing span:nth-child(3){ animation-delay:.36s; }
@keyframes ia-typing{ 0%,60%,100%{ transform:translateY(0); opacity:.4; } 30%{ transform:translateY(-4px); opacity:1; } }
@media (prefers-reduced-motion: reduce){ .ia-msg__typing span{ animation:none; opacity:.6; } }
`

const Spark = (props) => (<svg {...props} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" fill="currentColor"/><path d="M19 4.5l.6 1.9L21.5 7l-1.9.6L19 9.5l-.6-1.9L16.5 7l1.9-.6L19 4.5z" fill="currentColor" opacity=".85"/></svg>)

/**
 * A single conversation turn. AI turns get the gradient spark avatar + tinted
 * bubble + optional action chips; user turns get an azure right-aligned bubble.
 * Set `typing` to show the animated indicator instead of content.
 */
export function AIMessage({
  role = 'ai',           // 'ai' | 'user'
  name,
  typing = false,
  actions = null,        // array of nodes (e.g. <Button>s) or a node
  className = '',
  children,
  ...rest
}) {
  injectOnce('ia-msg', CSS)
  const isAI = role === 'ai'
  const displayName = name || (isAI ? 'ИИ-аналитик' : 'Вы')
  return (
    <div className={['ia-msg', `ia-msg--${role}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className={['ia-msg__avatar', isAI ? 'ia-msg__avatar--ai' : 'ia-msg__avatar--user'].filter(Boolean).join(' ')}>
        {isAI ? <Spark /> : (name ? name[0].toUpperCase() : 'В')}
      </span>
      <div className="ia-msg__body">
        <span className="ia-msg__name">{isAI && <Spark />}{displayName}</span>
        {typing ? (
          <div className="ia-msg__bubble ia-msg__typing" aria-label="ИИ печатает"><span></span><span></span><span></span></div>
        ) : (
          <div className="ia-msg__bubble">{children}</div>
        )}
        {actions && !typing && <div className="ia-msg__actions">{Array.isArray(actions) ? actions : actions}</div>}
      </div>
    </div>
  )
}
