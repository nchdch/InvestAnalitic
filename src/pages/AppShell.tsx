import React from 'react'
import logoMark from '../assets/logo-mark.svg'
import { Button, IconButton, Avatar } from '../components'
import { LayoutDashboard, Sparkles, Scale, Calendar, Plus, Bell, Search, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'

const RUB = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

interface NavItem {
  id: string
  label: string
  Icon: LucideIcon
  pip?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Портфель',       Icon: LayoutDashboard },
  { id: 'assistant', label: 'ИИ-аналитик',    Icon: Sparkles, pip: true },
  { id: 'rebalance', label: 'Ребалансировка', Icon: Scale },
  { id: 'calendar',  label: 'Выплаты',        Icon: Calendar },
]

export type PageId = 'dashboard' | 'assistant' | 'rebalance' | 'calendar'

interface Props {
  page: PageId
  onNav: (page: PageId) => void
  onAddTrade: () => void
  children: React.ReactNode
}

const PAGE_TITLE: Record<PageId, { title: string; sub: string }> = {
  dashboard:  { title: 'Портфель',      sub: 'Обзор активов и P&L' },
  assistant:  { title: 'ИИ-аналитик',   sub: 'Спрашивай, добавляй сделки, получай разбор' },
  rebalance:  { title: 'Ребалансировка', sub: 'Целевые веса и план сделок' },
  calendar:   { title: 'Выплаты',       sub: 'Дивиденды и купоны' },
}

export function AppShell({ page, onNav, onAddTrade, children }: Props) {
  const { accounts } = usePortfolio()

  return (
    <div className="ia-app">
      <aside className="ia-sidebar">
        <div className="ia-sidebar__brand">
          <img src={logoMark} alt="" width={32} height={32} />
          <span className="ia-sidebar__word">Invest<b>Analitic</b></span>
        </div>

        <nav className="ia-sidebar__nav">
          {NAV_ITEMS.map(({ id, label, Icon, pip }) => (
            <button
              key={id}
              className={'ia-navitem' + (page === id ? ' is-active' : '')}
              onClick={() => onNav(id as PageId)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {pip && <span className="ia-navitem__pip" />}
            </button>
          ))}
        </nav>

        <div className="ia-sidebar__accounts">
          <div className="ia-eyebrow" style={{ padding: '0 4px 8px' }}>Счета</div>
          {accounts.map((a) => (
            <div key={a.id} className="ia-acctmini">
              <Avatar name={a.name} size="sm" />
              <div className="ia-acctmini__txt">
                <div className="ia-acctmini__name">{a.name}</div>
                <div className="ia-acctmini__val ia-num">{RUB.format(a.totalValue)} ₽</div>
              </div>
            </div>
          ))}
          <button className="ia-navitem ia-navitem--ghost" onClick={onAddTrade}>
            <Plus size={16} /><span>Добавить счёт</span>
          </button>
        </div>

        <div className="ia-sidebar__user">
          <Avatar name="Алексей М" shape="circle" size="sm" color="var(--ink-600)" />
          <span>Алексей М.</span>
          <IconButton label="Настройки" size="sm"><Settings size={16} /></IconButton>
        </div>
      </aside>

      <main className="ia-main">
        <header className="ia-topbar">
          <div>
            <h1 className="ia-topbar__title">{PAGE_TITLE[page].title}</h1>
            <p className="ia-topbar__sub">{PAGE_TITLE[page].sub}</p>
          </div>
          <div className="ia-topbar__actions">
            <div className="ia-search">
              <Search size={16} />
              <input placeholder="Поиск тикера, эмитента…" />
            </div>
            <IconButton variant="outlined" label="Уведомления"><Bell size={18} /></IconButton>
            <Button leftIcon={<Plus size={18} />} onClick={onAddTrade}>Добавить сделку</Button>
          </div>
        </header>
        <div className="ia-content">{children}</div>
      </main>
    </div>
  )
}
