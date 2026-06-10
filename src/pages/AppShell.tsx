import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoMark from '../assets/logo-mark.svg'
import { Button, IconButton, Avatar } from '../components'
import { LayoutDashboard, Sparkles, Scale, Calendar, Plus, Bell, Search, Settings, LogOut, Building2, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Layers, TrendingUp, Wallet, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { usePortfolioStore } from '../store/portfolioStore'
import { logoutUser } from '../api/auth'
import { refreshPrices } from '../api/client'

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
  onAddPortfolio: () => void
  onAddDeposit: () => void
  onImportTrades: () => void
  children: React.ReactNode
}

const PAGE_TITLE: Record<PageId, { title: string; sub: string }> = {
  dashboard:  { title: 'Портфель',      sub: 'Обзор активов и P&L' },
  assistant:  { title: 'ИИ-аналитик',   sub: 'Спрашивай, добавляй сделки, получай разбор' },
  rebalance:  { title: 'Ребалансировка', sub: 'Целевые веса и план сделок' },
  calendar:   { title: 'Выплаты',       sub: 'Дивиденды и купоны' },
}

export function AppShell({ page, onNav, onAddTrade, onAddPortfolio, onAddDeposit, onImportTrades, children }: Props) {
  const { accounts } = usePortfolio()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { orgs, activeOrg, setActiveOrg, clearOrgs } = useOrgStore()
  const navigate = useNavigate()
  const bump = usePortfolioStore((s) => s.bump)
  const selectedAccountId = usePortfolioStore((s) => s.selectedAccountId)
  const setSelectedAccountId = usePortfolioStore((s) => s.setSelectedAccountId)

  const [orgOpen, setOrgOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [actionOpen, setActionOpen] = useState(false)
  const actionRef = useRef<HTMLDivElement>(null)

  // Подтягиваем актуальные котировки при загрузке и при смене активного портфеля
  useEffect(() => {
    if (!activeOrg) return
    refreshPrices().then(bump).catch(() => {
      // молча игнорируем — котировки обновятся при следующей попытке
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.id])

  const activeOrgs = orgs.filter((o) => o.status === 'active')
  const canSwitch = activeOrgs.length > 1

  useEffect(() => {
    if (!orgOpen) return
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOrgOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [orgOpen])

  useEffect(() => {
    if (!actionOpen) return
    function handle(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setActionOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [actionOpen])

  const handleLogout = async () => {
    await logoutUser().catch(() => {})
    clearAuth()
    clearOrgs()
    navigate('/auth', { replace: true })
  }

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Пользователь'

  return (
    <div className="ia-app">
      <aside className="ia-sidebar">
        <div className="ia-sidebar__brand">
          <img src={logoMark} alt="" width={32} height={32} />
          <span className="ia-sidebar__word">Invest<b>Analitic</b></span>
        </div>

        {activeOrg && (
          <div
            ref={dropdownRef}
            className={'ia-org-switch' + (canSwitch ? ' ia-org-switch--interactive' : '')}
            onClick={() => canSwitch && setOrgOpen((v) => !v)}
          >
            <Building2 size={15} style={{ flexShrink: 0, color: 'var(--accent)' }} />
            <span className="ia-org-switch__name">{activeOrg.name}</span>
            {canSwitch && (orgOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
            {orgOpen && (
              <div className="ia-org-switch__dropdown">
                {activeOrgs.map((org) => (
                  <button
                    key={org.id}
                    className={'ia-org-switch__item' + (org.id === activeOrg.id ? ' is-active' : '')}
                    onClick={(e) => { e.stopPropagation(); setActiveOrg(org); setOrgOpen(false) }}
                  >
                    <Building2 size={13} />
                    {org.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
          <div className="ia-eyebrow" style={{ padding: '0 4px 8px' }}>Портфели</div>
          {accounts.length > 1 && (
            <button
              className={'ia-acctmini' + (selectedAccountId === null ? ' is-active' : '')}
              onClick={() => setSelectedAccountId(null)}
            >
              <span className="ia-acctmini__icon"><Layers size={14} /></span>
              <div className="ia-acctmini__txt">
                <div className="ia-acctmini__name">Все портфели</div>
              </div>
            </button>
          )}
          {accounts.map((a) => {
            const isActive = selectedAccountId === a.id
            const isProfit = a.unrealizedPnl >= 0
            return (
              <button
                key={a.id}
                className={'ia-acctmini' + (isActive ? ' is-active' : '')}
                onClick={() => setSelectedAccountId(a.id)}
              >
                <Avatar name={a.name} size="sm" />
                <div className="ia-acctmini__txt">
                  <div className="ia-acctmini__name">{a.name}</div>
                  <div className="ia-acctmini__val ia-num">
                    {isProfit
                      ? <ArrowUpRight size={12} className="ia-acctmini__pnl ia-acctmini__pnl--up" />
                      : <ArrowDownRight size={12} className="ia-acctmini__pnl ia-acctmini__pnl--down" />}
                    {RUB.format(a.totalValue)} ₽
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="ia-sidebar__user">
          <Avatar name={displayName} shape="circle" size="sm" color="var(--ink-600)" />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          <IconButton label="Управление организациями" size="sm" onClick={() => navigate('/org-setup')}><Settings size={16} /></IconButton>
          <IconButton label="Выйти" size="sm" onClick={handleLogout}><LogOut size={16} /></IconButton>
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
            <div className="ia-action-menu" ref={actionRef}>
              <Button
                leftIcon={<Plus size={18} />}
                rightIcon={actionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                onClick={() => setActionOpen((v) => !v)}
              >
                Действие
              </Button>
              {actionOpen && (
                <div className="ia-action-menu__dropdown">
                  <button className="ia-action-menu__item" onClick={() => { setActionOpen(false); onAddTrade() }}>
                    <TrendingUp size={15} /> Добавить сделку
                  </button>
                  <button className="ia-action-menu__item" onClick={() => { setActionOpen(false); onAddPortfolio() }}>
                    <Layers size={15} /> Добавить портфель
                  </button>
                  <button className="ia-action-menu__item" onClick={() => { setActionOpen(false); onAddDeposit() }}>
                    <Wallet size={15} /> Добавить депозит
                  </button>
                  <hr className="ia-action-menu__divider" />
                  <button className="ia-action-menu__item" onClick={() => { setActionOpen(false); onImportTrades() }}>
                    <Upload size={15} /> Импорт сделок
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="ia-content">{children}</div>
      </main>
    </div>
  )
}
