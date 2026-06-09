import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-card{
  background:var(--surface-card); border:1px solid var(--border-1);
  border-radius:var(--radius-lg); box-shadow:var(--shadow-sm);
  font-family:var(--font-sans); color:var(--text-2); overflow:hidden;
}
.ia-card--flat{ box-shadow:none; }
.ia-card--raised{ box-shadow:var(--shadow-md); }
.ia-card--interactive{ cursor:pointer; transition:box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out); }
.ia-card--interactive:hover{ box-shadow:var(--shadow-md); border-color:var(--border-2); }
.ia-card__header{ display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid var(--divider); }
.ia-card__title{ font-size:var(--text-h4); font-weight:var(--fw-semibold); color:var(--text-1); margin:0; }
.ia-card__sub{ font-size:var(--text-sm); color:var(--text-3); margin:2px 0 0; }
.ia-card__actions{ margin-left:auto; display:flex; align-items:center; gap:6px; }
.ia-card__body{ padding:20px; }
.ia-card__body--tight{ padding:0; }
`

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  elevation?: 'flat' | 'sm' | 'md'
  interactive?: boolean
  tightBody?: boolean
}

export function Card({
  title,
  subtitle,
  actions = null,
  elevation = 'sm',
  interactive = false,
  tightBody = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  injectOnce('ia-card', CSS)
  const cls = [
    'ia-card',
    elevation === 'flat' ? 'ia-card--flat' : '',
    elevation === 'md' ? 'ia-card--raised' : '',
    interactive ? 'ia-card--interactive' : '',
    className,
  ].filter(Boolean).join(' ')
  const hasHeader = title || subtitle || actions
  return (
    <div className={cls} {...rest}>
      {hasHeader && (
        <div className="ia-card__header">
          <div>
            {title && <h3 className="ia-card__title">{title}</h3>}
            {subtitle && <p className="ia-card__sub">{subtitle}</p>}
          </div>
          {actions && <div className="ia-card__actions">{actions}</div>}
        </div>
      )}
      <div className={['ia-card__body', tightBody ? 'ia-card__body--tight' : ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  )
}
