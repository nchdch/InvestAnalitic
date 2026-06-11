import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { IconButton } from '../forms/IconButton'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-row-menu { position: relative; display: inline-flex; }
.ia-row-menu__panel {
  position: fixed; z-index: 1000;
  min-width: 210px; background: var(--surface-card); border: 1px solid var(--border-1);
  border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 6px;
  display: flex; flex-direction: column; gap: 1px;
}
.ia-row-menu__item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 10px; border: 0; background: transparent; border-radius: var(--radius-sm);
  font-size: var(--text-sm); font-family: inherit; color: var(--text-2); cursor: pointer; text-align: left;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.ia-row-menu__item:hover { background: var(--surface-sunken); color: var(--text-1); }
.ia-row-menu__item.is-danger { color: var(--loss); }
.ia-row-menu__item.is-danger:hover { background: var(--loss-soft); }
.ia-row-menu__item svg { flex-shrink: 0; color: var(--text-3); }
.ia-row-menu__item.is-danger svg { color: var(--loss); }
.ia-row-menu__sep { height: 1px; background: var(--divider); margin: 4px 2px; }
`

export interface RowAction {
  key: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  separatorBefore?: boolean
  onClick: () => void
}

export interface RowActionsMenuProps {
  actions: RowAction[]
  label?: string
}

export function RowActionsMenu({ actions, label = 'Действия' }: RowActionsMenuProps) {
  injectOnce('ia-row-menu', CSS)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onScroll() {
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  if (actions.length === 0) return null

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((v) => !v)
  }

  return (
    <div className="ia-row-menu" ref={triggerRef} onClick={(e) => e.stopPropagation()}>
      <IconButton size="sm" variant="ghost" label={label} onClick={toggle}>
        <MoreVertical size={15} />
      </IconButton>
      {open && pos && createPortal(
        <div className="ia-row-menu__panel" ref={panelRef} style={{ top: pos.top, right: pos.right }}>
          {actions.map((a) => (
            <React.Fragment key={a.key}>
              {a.separatorBefore && <div className="ia-row-menu__sep" />}
              <button
                type="button"
                className={`ia-row-menu__item${a.danger ? ' is-danger' : ''}`}
                onClick={() => { setOpen(false); a.onClick() }}
              >
                {a.icon}
                {a.label}
              </button>
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
