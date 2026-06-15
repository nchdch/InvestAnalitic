import React, { useEffect, useRef, useState } from 'react'
import { Card, StatCard, PnLValue, Badge, AllocationBar, Avatar, Sparkline, Tabs, Button, IconButton, RowActionsMenu } from '../components'
import {
  Sparkles, Download, PackageOpen, ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight,
  Receipt, StickyNote, Plus, Minus, Coins, Pencil, ArrowRightLeft, Trash2,
  ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { usePortfolioStore } from '../store/portfolioStore'
import { usePositionTrades } from '../hooks/usePositionTrades'
import { getPriceHistory, deletePosition } from '../api/client'
import { getTickerLogoUrl } from '../utils/logos'
import { formatPrice, formatDuration } from '../utils/format'
import { AssetDetailPage } from './AssetDetailPage'
import { TradesListModal } from '../components/portfolio/TradesListModal'
import { NotesModal } from '../components/portfolio/NotesModal'
import { PaymentRecordModal } from '../components/portfolio/PaymentRecordModal'
import { EditQuantityModal } from '../components/portfolio/EditQuantityModal'
import { TransferPositionModal } from '../components/portfolio/TransferPositionModal'
import { TradeModal } from '../components/portfolio/TradeModal'
import { DepositModal } from '../components/portfolio/DepositModal'
import type { TradeModalInitial } from '../components/portfolio/TradeModal'
import type { DepositModalInitial } from '../components/portfolio/DepositModal'
import type { AccountSummary, EquityRow, BondRow, CashRow, Position } from '@/types'
import type { RowAction } from '../components'

const RUB = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NUM0 = new Intl.NumberFormat('ru-RU')
const money = (v: number) => RUB.format(v) + ' ₽'

// ─── Сортировка таблиц ─────────────────────────────────────────────────────────

type SortDirection = 'asc' | 'desc'

interface TableSort<K extends string> {
  key: K | null
  direction: SortDirection
}

/** Состояние сортировки таблицы: клик по той же колонке переключает направление, по новой — задаёт убывание. */
function useTableSort<K extends string>() {
  const [sort, setSort] = useState<TableSort<K>>({ key: null, direction: 'desc' })
  const toggle = (key: K) => {
    setSort((prev) => prev.key === key
      ? { key, direction: prev.direction === 'desc' ? 'asc' : 'desc' }
      : { key, direction: 'desc' })
  }
  return { sort, toggle }
}

function sortRows<T, K extends string>(rows: T[], sort: TableSort<K>, getValue: (row: T, key: K) => number | string): T[] {
  if (!sort.key) return rows
  const key = sort.key
  const dir = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = getValue(a, key)
    const bv = getValue(b, key)
    let cmp: number
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else {
      cmp = String(av).localeCompare(String(bv), 'ru')
    }
    return cmp * dir
  })
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ChevronsUpDown size={12} style={{ opacity: 0.35, flexShrink: 0 }} />
  return direction === 'asc'
    ? <ChevronUp size={12} style={{ flexShrink: 0 }} />
    : <ChevronDown size={12} style={{ flexShrink: 0 }} />
}

/** Заголовок таблицы с переключением сортировки по клику. */
function SortTh({ children, align = 'right', width, active, direction, onClick }: {
  children: React.ReactNode
  align?: 'left' | 'right'
  width?: number | string
  active: boolean
  direction: SortDirection
  onClick: () => void
}) {
  return (
    <th
      className={align === 'right' ? 'r' : undefined}
      style={{ width, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      onClick={onClick}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {children}
        <SortIcon active={active} direction={direction} />
      </span>
    </th>
  )
}

function makeSortProps<K extends string>(sort: TableSort<K>, toggle: (key: K) => void) {
  return (key: K) => ({
    active: sort.key === key,
    direction: sort.direction,
    onClick: () => toggle(key),
  })
}

// Сводный отчёт: сортировка строк-позиций внутри групп «Акции» / «Облигации»
type SummarySortKey = 'name' | 'quantity' | 'currentValue' | 'investedValue' | 'pnl' | 'pnlPercent' | 'dayChange' | 'assetTypeWeight' | 'portfolioWeight'

function summaryRowSortValue(row: EquityRow | BondRow, key: SummarySortKey): number | string {
  switch (key) {
    case 'name': return row.position.name ?? row.position.ticker
    case 'quantity': return row.position.quantity
    case 'currentValue': return row.currentValue
    case 'investedValue': return row.investedValue
    case 'pnl': return row.unrealizedPnl
    case 'pnlPercent': return row.unrealizedPnlPercent
    case 'dayChange': return row.dayChange ?? -Infinity
    case 'assetTypeWeight': return row.assetTypeWeight
    case 'portfolioWeight': return row.portfolioWeight
    default: return 0
  }
}

// «Все активы»: общая строка по акциям/облигациям с привязкой к счёту
type AllAssetsRow =
  | (EquityRow & { accountName: string; type: 'equity' })
  | (BondRow & { accountName: string; type: 'bond' })

type AllAssetsSortKey = 'ticker' | 'type' | 'quantity' | 'currentValue' | 'investedValue' | 'pnl' | 'dayChange' | 'assetTypeWeight' | 'portfolioWeight' | 'accountName'

function allAssetsSortValue(row: AllAssetsRow, key: AllAssetsSortKey): number | string {
  switch (key) {
    case 'ticker': return row.position.ticker
    case 'type': return row.type
    case 'quantity': return row.position.quantity
    case 'currentValue': return row.currentValue
    case 'investedValue': return row.investedValue
    case 'pnl': return row.unrealizedPnl
    case 'dayChange': return row.dayChange ?? -Infinity
    case 'assetTypeWeight': return row.assetTypeWeight
    case 'portfolioWeight': return row.portfolioWeight
    case 'accountName': return row.accountName
    default: return 0
  }
}

// Вкладка «Акции»
type EqSortKey = 'name' | 'quantity' | 'currentPrice' | 'currentValue' | 'pnl' | 'dayChange' | 'assetTypeWeight' | 'portfolioWeight'

function equitySortValue(row: EquityRow, key: EqSortKey): number | string {
  switch (key) {
    case 'name': return row.position.name ?? row.position.ticker
    case 'quantity': return row.position.quantity
    case 'currentPrice': return row.currentPrice
    case 'currentValue': return row.currentValue
    case 'pnl': return row.unrealizedPnl
    case 'dayChange': return row.dayChange ?? -Infinity
    case 'assetTypeWeight': return row.assetTypeWeight
    case 'portfolioWeight': return row.portfolioWeight
    default: return 0
  }
}

// Вкладка «Облигации»
type BondSortKey = 'name' | 'quantity' | 'currentValue' | 'totalPnl' | 'ytm' | 'maturityDate' | 'assetTypeWeight' | 'portfolioWeight'

function bondSortValue(row: BondRow, key: BondSortKey): number | string {
  switch (key) {
    case 'name': return row.position.name ?? row.position.ticker
    case 'quantity': return row.position.quantity
    case 'currentValue': return row.currentValue
    case 'totalPnl': return row.totalPnl
    case 'ytm': return row.ytm ?? -Infinity
    case 'maturityDate': return row.position.maturityDate
    case 'assetTypeWeight': return row.assetTypeWeight
    case 'portfolioWeight': return row.portfolioWeight
    default: return 0
  }
}

// Вкладка «Деньги»
type CashSortKey = 'currency' | 'amount' | 'rate' | 'rubEquivalent' | 'portfolioWeight'

function cashSortValue(row: CashRow, key: CashSortKey): number | string {
  switch (key) {
    case 'currency': return row.balance.currency
    case 'amount': return row.balance.amount
    case 'rate': return row.rate
    case 'rubEquivalent': return row.rubEquivalent
    case 'portfolioWeight': return row.portfolioWeight
    default: return 0
  }
}

// ─── Контекстное меню действий по активу ──────────────────────────────────────

/** Описывает, какая модалка должна быть открыта по выбору пункта контекстного меню строки. */
export type ActiveModal =
  | { kind: 'trades'; accountId: string; ticker: string; name?: string }
  | { kind: 'notes'; positionId: string; ticker: string; name?: string }
  | { kind: 'trade'; initial: TradeModalInitial }
  | { kind: 'payment'; accountId: string; position: Position }
  | { kind: 'editQty'; position: Position }
  | { kind: 'transfer'; position: Position }
  | { kind: 'deposit'; initial: DepositModalInitial }

/** Пункты меню «⋮» для строки акции/облигации (см. CLAUDE.md: все сделки, заметки, купить/продать и т.д.). */
function buildPositionActions(position: Position, openModal: (m: ActiveModal) => void, onDelete: (position: Position) => void): RowAction[] {
  const isBond = position.assetType === 'bond'
  const tradeBase: TradeModalInitial = {
    accountId: position.accountId,
    ticker: position.ticker,
    name: position.name,
    assetType: position.assetType,
    exchange: position.exchange,
    currency: position.currency,
  }
  return [
    {
      key: 'trades',
      label: 'Все сделки',
      icon: <Receipt size={15} />,
      onClick: () => openModal({ kind: 'trades', accountId: position.accountId, ticker: position.ticker, name: position.name }),
    },
    {
      key: 'notes',
      label: 'Заметки',
      icon: <StickyNote size={15} />,
      onClick: () => openModal({ kind: 'notes', positionId: position.id, ticker: position.ticker, name: position.name }),
    },
    {
      key: 'buy',
      label: 'Купить',
      icon: <Plus size={15} />,
      onClick: () => openModal({ kind: 'trade', initial: { ...tradeBase, side: 'buy' } }),
    },
    {
      key: 'sell',
      label: 'Продать',
      icon: <Minus size={15} />,
      onClick: () => openModal({ kind: 'trade', initial: { ...tradeBase, side: 'sell' } }),
    },
    {
      key: 'payment',
      label: isBond ? 'Купон / амортизация / погашение' : 'Дивиденды',
      icon: <Coins size={15} />,
      onClick: () => openModal({ kind: 'payment', accountId: position.accountId, position }),
    },
    {
      key: 'editQty',
      label: 'Изменить количество',
      icon: <Pencil size={15} />,
      onClick: () => openModal({ kind: 'editQty', position }),
    },
    {
      key: 'transfer',
      label: 'Перенести на другой счёт',
      icon: <ArrowRightLeft size={15} />,
      onClick: () => openModal({ kind: 'transfer', position }),
    },
    {
      key: 'delete',
      label: 'Удалить',
      icon: <Trash2 size={15} />,
      danger: true,
      separatorBefore: true,
      onClick: () => onDelete(position),
    },
  ]
}

/** Пункты меню «⋮» для строки денежного остатка — минимальный набор, т.к. у кэша нет id и CRUD по записям. */
function buildCashActions(row: CashRow, openModal: (m: ActiveModal) => void): RowAction[] {
  return [
    {
      key: 'deposit',
      label: 'Пополнить',
      icon: <ArrowDownToLine size={15} />,
      onClick: () => openModal({ kind: 'deposit', initial: { accountId: row.balance.accountId, currency: row.balance.currency, direction: 'deposit' } }),
    },
    {
      key: 'withdraw',
      label: 'Списать',
      icon: <ArrowUpFromLine size={15} />,
      onClick: () => openModal({ kind: 'deposit', initial: { accountId: row.balance.accountId, currency: row.balance.currency, direction: 'withdrawal' } }),
    },
  ]
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--text-3)' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  )
}

function EmptyState() {
  const bump = usePortfolioStore((s) => s.bump)
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: '64px 24px', textAlign: 'center',
    }}>
      <PackageOpen size={48} strokeWidth={1.2} color="var(--text-4)" />
      <div>
        <div style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-1)', marginBottom: 8 }}>
          Портфель пока пуст
        </div>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-3)', maxWidth: 360 }}>
          Нажмите «Добавить сделку» в верхней панели, чтобы внести первую покупку.
        </div>
      </div>
      <Button variant="soft" size="sm" onClick={bump}>Обновить</Button>
    </div>
  )
}

// ─── Сводный отчёт ────────────────────────────────────────────────────────────

function DashCell({ value, percent }: { value: number | null; percent?: number | null }) {
  if (value == null) return <span style={{ color: 'var(--text-4)' }}>—</span>
  if (percent != null) return <PnLValue value={value} percent={percent} display="both" size="sm" />
  return <PnLValue value={value} display="money" size="sm" />
}

function SummaryReportTable({ accounts, totalValue, onSelectTicker }: { accounts: AccountSummary[]; totalValue: number; onSelectTicker: (ticker: string) => void }) {
  // expandedAccounts: какие портфели раскрыты
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(accounts.map((a) => a.id))
  )
  // expandedTypes: какие подгруппы (accId-eq / accId-bond) раскрыты
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const toggleAcc = (id: string) =>
    setExpandedAccounts((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleType = (key: string) =>
    setExpandedTypes((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  const { sort, toggle: toggleSort } = useTableSort<SummarySortKey>()
  const sortProps = makeSortProps(sort, toggleSort)

  return (
    <table className="ia-table ia-table--compact">
      <thead>
        <tr>
          <SortTh align="left" width="24%" {...sortProps('name')}>Название</SortTh>
          <SortTh {...sortProps('quantity')}>Кол-во</SortTh>
          <SortTh {...sortProps('currentValue')}>Стоимость</SortTh>
          <SortTh {...sortProps('investedValue')}>Инвестировано</SortTh>
          <SortTh {...sortProps('pnl')}>Прибыль, ₽</SortTh>
          <SortTh {...sortProps('pnlPercent')}>Прибыль, %</SortTh>
          <SortTh {...sortProps('dayChange')}>Изм. за день</SortTh>
          <SortTh {...sortProps('assetTypeWeight')}>Доля в категории, %</SortTh>
          <SortTh {...sortProps('portfolioWeight')}>Доля в портфеле, %</SortTh>
        </tr>
      </thead>
      <tbody>
        {accounts.map((acc) => {
          const accOpen = expandedAccounts.has(acc.id)
          const eqKey = acc.id + '-eq'
          const bondKey = acc.id + '-bond'
          const eqOpen = expandedTypes.has(eqKey)
          const bondOpen = expandedTypes.has(bondKey)

          const equityValue    = acc.equityRows.reduce((s, r) => s + r.currentValue, 0)
          const equityInvested = acc.equityRows.reduce((s, r) => s + r.investedValue, 0)
          const equityPnl      = acc.equityRows.reduce((s, r) => s + r.unrealizedPnl, 0)
          const equityDayChange = acc.equityRows.some((r) => r.dayChange != null)
            ? acc.equityRows.reduce((s, r) => s + (r.dayChange ?? 0), 0) : null

          const equityCategoryShare = acc.equityRows.reduce((s, r) => s + r.assetTypeWeight, 0)

          const bondValue    = acc.bondRows.reduce((s, r) => s + r.currentValue, 0)
          const bondInvested = acc.bondRows.reduce((s, r) => s + r.investedValue, 0)
          const bondPnl      = acc.bondRows.reduce((s, r) => s + r.unrealizedPnl, 0)
          const bondDayChange = acc.bondRows.some((r) => r.dayChange != null)
            ? acc.bondRows.reduce((s, r) => s + (r.dayChange ?? 0), 0) : null
          const bondCategoryShare = acc.bondRows.reduce((s, r) => s + r.assetTypeWeight, 0)

          const accShare = totalValue > 0 ? (acc.totalValue / totalValue) * 100 : 0

          return (
            <React.Fragment key={acc.id}>
              {/* ── Уровень 1: Портфель ── */}
              <tr style={{ cursor: 'pointer', background: 'var(--surface-sunken)' }} onClick={() => toggleAcc(acc.id)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-1)' }}>
                    {accOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {acc.name}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)', fontWeight: 400 }}>{acc.broker}</span>
                  </div>
                </td>
                <td className="r" style={{ color: 'var(--text-4)' }}>—</td>
                <td className="r ia-num" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{money(acc.totalValue)}</td>
                <td className="r ia-num">{money(acc.investedValue)}</td>
                <td className="r"><PnLValue value={acc.unrealizedPnl} display="money" size="sm" /></td>
                <td className="r"><PnLValue percent={acc.unrealizedPnlPercent} display="percent" size="sm" /></td>
                <td className="r"><DashCell value={acc.dayChange !== 0 ? acc.dayChange : null} /></td>
                <td className="r" style={{ color: 'var(--text-4)' }}>—</td>
                <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(accShare)}%</td>
              </tr>

              {/* ── Уровень 2: Акции ── */}
              {accOpen && acc.equityRows.length > 0 && (
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); toggleType(eqKey) }}
                >
                  <td style={{ paddingLeft: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontWeight: 500 }}>
                      {eqOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      Акции
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)' }}>{acc.equityRows.length}</span>
                    </div>
                  </td>
                  <td className="r" style={{ color: 'var(--text-4)' }}>—</td>
                  <td className="r ia-num">{money(equityValue)}</td>
                  <td className="r ia-num">{money(equityInvested)}</td>
                  <td className="r"><PnLValue value={equityPnl} display="money" size="sm" /></td>
                  <td className="r">
                    <DashCell value={equityInvested > 0 ? (equityPnl / equityInvested) * 100 : null} />
                  </td>
                  <td className="r"><DashCell value={equityDayChange} /></td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(equityCategoryShare)}%</td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>
                    {totalValue > 0 ? RUB.format((equityValue / totalValue) * 100) : '0,00'}%
                  </td>
                </tr>
              )}

              {/* ── Уровень 3: Каждая акция ── */}
              {accOpen && eqOpen && sortRows(acc.equityRows, sort, summaryRowSortValue).map((row) => (
                <tr
                  key={row.position.id}
                  style={{ opacity: 0.95, cursor: 'pointer' }}
                  onClick={() => onSelectTicker(row.position.ticker)}
                >
                  <td style={{ paddingLeft: 56 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={row.position.ticker} src={getTickerLogoUrl(row.position.ticker, 'equity')} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{row.position.ticker}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{row.position.name ?? row.position.ticker}</div>
                      </div>
                    </div>
                  </td>
                  <td className="r ia-num">{NUM0.format(row.position.quantity)}</td>
                  <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
                  <td className="r ia-num">{money(row.investedValue)}</td>
                  <td className="r">
                    {row.unrealizedPnl !== 0
                      ? <PnLValue value={row.unrealizedPnl} display="money" size="sm" />
                      : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>нет цены</span>}
                  </td>
                  <td className="r">
                    {row.unrealizedPnl !== 0
                      ? <PnLValue percent={row.unrealizedPnlPercent} display="percent" size="sm" />
                      : <span style={{ color: 'var(--text-4)' }}>—</span>}
                  </td>
                  <td className="r">
                    <DashCell value={row.dayChange} percent={row.dayChangePercent} />
                  </td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(row.assetTypeWeight)}%</td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(row.portfolioWeight)}%</td>
                </tr>
              ))}

              {/* ── Уровень 2: Облигации ── */}
              {accOpen && acc.bondRows.length > 0 && (
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); toggleType(bondKey) }}
                >
                  <td style={{ paddingLeft: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontWeight: 500 }}>
                      {bondOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      Облигации
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)' }}>{acc.bondRows.length}</span>
                    </div>
                  </td>
                  <td className="r" style={{ color: 'var(--text-4)' }}>—</td>
                  <td className="r ia-num">{money(bondValue)}</td>
                  <td className="r ia-num">{money(bondInvested)}</td>
                  <td className="r"><PnLValue value={bondPnl} display="money" size="sm" /></td>
                  <td className="r">
                    <DashCell value={bondInvested > 0 ? (bondPnl / bondInvested) * 100 : null} />
                  </td>
                  <td className="r"><DashCell value={bondDayChange} /></td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(bondCategoryShare)}%</td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>
                    {totalValue > 0 ? RUB.format((bondValue / totalValue) * 100) : '0,00'}%
                  </td>
                </tr>
              )}

              {/* ── Уровень 3: Каждая облигация ── */}
              {accOpen && bondOpen && sortRows(acc.bondRows, sort, summaryRowSortValue).map((row) => (
                <tr key={row.position.id} style={{ opacity: 0.95 }}>
                  <td style={{ paddingLeft: 56 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={row.position.ticker} size="sm" color="var(--ink-600)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{row.position.ticker}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{row.position.name ?? row.position.ticker}</div>
                      </div>
                    </div>
                  </td>
                  <td className="r ia-num">{NUM0.format(row.position.quantity)}</td>
                  <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
                  <td className="r ia-num">{money(row.investedValue)}</td>
                  <td className="r">
                    {row.unrealizedPnl !== 0
                      ? <PnLValue value={row.unrealizedPnl} display="money" size="sm" />
                      : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>нет цены</span>}
                  </td>
                  <td className="r">
                    {row.unrealizedPnl !== 0
                      ? <PnLValue percent={row.unrealizedPnlPercent} display="percent" size="sm" />
                      : <span style={{ color: 'var(--text-4)' }}>—</span>}
                  </td>
                  <td className="r">
                    <DashCell value={row.dayChange} percent={row.dayChangePercent} />
                  </td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(row.assetTypeWeight)}%</td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(row.portfolioWeight)}%</td>
                </tr>
              ))}

              {/* ── Уровень 2: Деньги ── */}
              {accOpen && acc.cashRows.length > 0 && (
                <tr>
                  <td style={{ paddingLeft: 32, color: 'var(--text-2)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ChevronRight size={13} style={{ opacity: 0.3 }} />
                      Денежные средства
                    </div>
                  </td>
                  <td className="r" style={{ color: 'var(--text-4)' }}>—</td>
                  <td className="r ia-num">{money(acc.cashRows.reduce((s: number, r: { rubEquivalent: number }) => s + r.rubEquivalent, 0))}</td>
                  <td colSpan={6} style={{ color: 'var(--text-4)', textAlign: 'right', fontSize: 'var(--text-xs)' }}>—</td>
                </tr>
              )}
            </React.Fragment>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── Все активы ───────────────────────────────────────────────────────────────

function AllAssetsTable({ accounts, openModal, onDelete }: {
  accounts: AccountSummary[]
  openModal: (m: ActiveModal) => void
  onDelete: (position: Position) => void
}) {
  const allRows: AllAssetsRow[] = accounts.flatMap((acc) => [
    ...acc.equityRows.map((r) => ({ ...r, accountName: acc.name, type: 'equity' as const })),
    ...acc.bondRows.map((r) => ({ ...r, accountName: acc.name, type: 'bond' as const })),
  ])

  const { sort, toggle: toggleSort } = useTableSort<AllAssetsSortKey>()
  const sortProps = makeSortProps(sort, toggleSort)

  if (allRows.length === 0) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Нет позиций</div>
  }

  const sortedRows = sort.key
    ? sortRows(allRows, sort, allAssetsSortValue)
    : [...allRows].sort((a, b) => b.currentValue - a.currentValue)

  return (
    <table className="ia-table ia-table--compact">
      <thead>
        <tr>
          <SortTh align="left" {...sortProps('ticker')}>Тикер</SortTh>
          <SortTh align="left" {...sortProps('type')}>Тип</SortTh>
          <SortTh {...sortProps('quantity')}>Кол-во</SortTh>
          <SortTh {...sortProps('currentValue')}>Стоимость</SortTh>
          <SortTh {...sortProps('investedValue')}>Инвестировано</SortTh>
          <SortTh {...sortProps('pnl')}>Прибыль</SortTh>
          <SortTh {...sortProps('dayChange')}>Изм. за день</SortTh>
          <SortTh {...sortProps('assetTypeWeight')}>% от категории</SortTh>
          <SortTh {...sortProps('portfolioWeight')}>Вес</SortTh>
          <SortTh align="left" {...sortProps('accountName')}>Портфель</SortTh>
          <th style={{ width: 48 }}></th>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => {
          const pnl = row.type === 'equity' ? row.unrealizedPnl : (row as { unrealizedPnl: number }).unrealizedPnl
          const pnlPct = row.unrealizedPnlPercent
          return (
            <tr key={row.position.id}>
              <td>
                <div className="ia-cell-tk">
                  <Avatar name={row.position.ticker} src={getTickerLogoUrl(row.position.ticker, row.type)} size="sm" color={row.type === 'bond' ? 'var(--ink-600)' : undefined} />
                  <div>
                    <div className="ia-cell-tk__t ia-mono">{row.position.ticker}</div>
                    <div className="ia-cell-tk__n">{row.position.name ?? row.position.ticker}</div>
                  </div>
                </div>
              </td>
              <td>
                <Badge tone={row.type === 'equity' ? 'neutral' : 'accent'} size="sm">
                  {row.type === 'equity' ? 'Акция' : 'Облигация'}
                </Badge>
              </td>
              <td className="r ia-num">{NUM0.format(row.position.quantity)}</td>
              <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
              <td className="r ia-num">{money(row.investedValue)}</td>
              <td className="r">
                {pnl !== 0
                  ? <PnLValue value={pnl} percent={pnlPct} display="both" size="sm" />
                  : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>нет цены</span>}
              </td>
              <td className="r">
                {row.dayChange != null
                  ? <PnLValue value={row.dayChange} percent={row.dayChangePercent ?? undefined} display="both" size="sm" />
                  : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>—</span>}
              </td>
              <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.assetTypeWeight.toFixed(1)}%</td>
              <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
              <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{row.accountName}</td>
              <td className="r">
                <RowActionsMenu actions={buildPositionActions(row.position, openModal, onDelete)} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── Раскрывающиеся строки: акции и облигации ──────────────────────────────────

function RowToggle({ open, onClick }: { open: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      className="ia-row-toggle"
      onClick={(e) => { e.stopPropagation(); onClick(e) }}
      aria-label={open ? 'Свернуть детали' : 'Показать детали'}
    >
      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  )
}

function DetailStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ia-stat-row">
      <span className="ia-stat-row__label">{label}</span>
      <span className="ia-stat-row__value">{value}</span>
    </div>
  )
}

function TradeHistoryStats({ accountId, ticker, currency }: { accountId: string; ticker: string; currency: string }) {
  const { stats, isLoading } = usePositionTrades(accountId, ticker, true)
  if (isLoading || !stats) return <DetailStat label="Загрузка…" value="" />
  return (
    <>
      <DetailStat label="Дата первой сделки" value={stats.firstTradeDate ? new Date(stats.firstTradeDate).toLocaleDateString('ru-RU') : '—'} />
      <DetailStat label="Срок инвестирования" value={stats.firstTradeDate ? formatDuration(stats.firstTradeDate) : '—'} />
      <DetailStat label="Стоимость покупок" value={<span className="ia-num">{formatPrice(stats.totalBought, currency)}</span>} />
      <DetailStat label="Стоимость продаж" value={<span className="ia-num">{formatPrice(stats.totalSold, currency)}</span>} />
    </>
  )
}

function EquityDetailPanel({ row, sparkline }: { row: EquityRow; sparkline: number[] }) {
  const { position } = row
  return (
    <div className="ia-row-detail__inner">
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">Бумага</div>
        <DetailStat label="Тикер" value={<span className="ia-mono">{position.ticker}</span>} />
        <DetailStat label="ISIN" value={<span className="ia-mono">{position.isin ?? '—'}</span>} />
        <DetailStat label="Биржа" value={position.exchange} />
        <DetailStat label="Метод учёта" value={position.averagingMethod} />
      </div>
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">Объём и цена</div>
        <DetailStat label="Всего акций" value={<span className="ia-num">{NUM0.format(position.quantity)}</span>} />
        <DetailStat label="Средняя цена" value={<span className="ia-num">{formatPrice(position.averagePrice, position.currency)}</span>} />
        <DetailStat label="Текущая цена" value={<span className="ia-num">{formatPrice(row.currentPrice, position.currency)}</span>} />
        <DetailStat label="Инвестировано" value={<span className="ia-num">{money(row.investedValue)}</span>} />
      </div>
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">История сделок</div>
        <TradeHistoryStats accountId={position.accountId} ticker={position.ticker} currency={position.currency} />
      </div>
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">Динамика цены</div>
        <Sparkline data={sparkline} />
      </div>
    </div>
  )
}

function EquityTableRow({ row, expanded, onToggle, onSelectTicker, sparkline, openModal, onDelete }: {
  row: EquityRow
  expanded: boolean
  onToggle: () => void
  onSelectTicker: (ticker: string) => void
  sparkline: number[]
  openModal: (m: ActiveModal) => void
  onDelete: (position: Position) => void
}) {
  const { position } = row
  return (
    <React.Fragment>
      <tr style={{ cursor: 'pointer' }} onClick={() => onSelectTicker(position.ticker)}>
        <td style={{ width: 36 }}><RowToggle open={expanded} onClick={onToggle} /></td>
        <td>
          <div className="ia-cell-tk">
            <Avatar name={position.ticker} src={getTickerLogoUrl(position.ticker, 'equity')} size="sm" />
            <div>
              <div className="ia-cell-tk__t ia-mono">{position.ticker}</div>
              <div className="ia-cell-tk__n">{position.name ?? position.ticker}</div>
            </div>
          </div>
        </td>
        <td className="r ia-num">{NUM0.format(position.quantity)}</td>
        <td className="r ia-num">{RUB.format(row.currentPrice)}</td>
        <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
        <td className="r">
          {row.unrealizedPnl !== 0
            ? <PnLValue value={row.unrealizedPnl} percent={row.unrealizedPnlPercent} display="both" size="sm" />
            : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>нет цены</span>}
        </td>
        <td className="r">
          {row.dayChange != null
            ? <PnLValue value={row.dayChange} percent={row.dayChangePercent ?? undefined} display="both" size="sm" />
            : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>—</span>}
        </td>
        <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.assetTypeWeight.toFixed(1)}%</td>
        <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
        <td className="r">
          <RowActionsMenu actions={buildPositionActions(position, openModal, onDelete)} />
        </td>
      </tr>
      {expanded && (
        <tr className="ia-row-detail">
          <td colSpan={10}><EquityDetailPanel row={row} sparkline={sparkline} /></td>
        </tr>
      )}
    </React.Fragment>
  )
}

function BondDetailPanel({ row, sparkline }: { row: BondRow; sparkline: number[] }) {
  const { position } = row
  return (
    <div className="ia-row-detail__inner">
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">Выпуск</div>
        <DetailStat label="Тикер" value={<span className="ia-mono">{position.ticker}</span>} />
        <DetailStat label="ISIN" value={<span className="ia-mono">{position.isin ?? '—'}</span>} />
        <DetailStat label="Биржа" value={position.exchange} />
        <DetailStat
          label="Номинал"
          value={
            <span className="ia-num">
              {formatPrice(position.faceValue, position.currency)}
              {position.initialFaceValue != null && position.initialFaceValue !== position.faceValue
                ? ` из ${formatPrice(position.initialFaceValue, position.currency)}`
                : ''}
            </span>
          }
        />
        <DetailStat label="Лот, шт." value={<span className="ia-num">{position.lotSize ?? '—'}</span>} />
      </div>
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">Купон</div>
        <DetailStat label="Ставка" value={<span className="ia-num">{position.couponRate.toFixed(2)}%</span>} />
        <DetailStat label="НКД на бумагу" value={<span className="ia-num">{position.currentAccruedInterest != null ? formatPrice(position.currentAccruedInterest, position.currency) : '—'}</span>} />
        <DetailStat
          label="Ближайшая выплата"
          value={position.nextCouponDate
            ? <>{new Date(position.nextCouponDate).toLocaleDateString('ru-RU')} · <span className="ia-num">{formatPrice(position.nextCouponValue ?? 0, position.currency)}</span></>
            : '—'}
        />
        <DetailStat label="Получено купонов" value={<span className="ia-num">{row.couponIncome > 0 ? money(row.couponIncome) : '—'}</span>} />
      </div>
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">Доходность и погашение</div>
        <DetailStat label="Текущая доходность" value={<span className="ia-num">{row.currentYield != null ? `${row.currentYield.toFixed(2)}%` : '—'}</span>} />
        <DetailStat label="YTM" value={<span className="ia-num">{row.ytm != null ? `${row.ytm.toFixed(2)}%` : '—'}</span>} />
        <DetailStat label="Дата погашения" value={position.maturityDate ? new Date(position.maturityDate).toLocaleDateString('ru-RU') : '—'} />
        <DetailStat label="Дней до погашения" value={<span className="ia-num">{row.daysToMaturity ?? '—'}</span>} />
        {position.offerDate && <DetailStat label="Оферта" value={new Date(position.offerDate).toLocaleDateString('ru-RU')} />}
      </div>
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">История сделок</div>
        <TradeHistoryStats accountId={position.accountId} ticker={position.ticker} currency={position.currency} />
      </div>
      {position.amortization && position.amortization.length > 0 && (
        <div className="ia-row-detail__group ia-row-detail__full">
          <div className="ia-row-detail__title">График амортизации и погашения</div>
          <table className="ia-table ia-table--compact">
            <thead>
              <tr>
                <th>Дата</th>
                <th className="r">% от номинала</th>
                <th className="r">На бумагу</th>
                <th className="r">По позиции</th>
              </tr>
            </thead>
            <tbody>
              {position.amortization.map((ev) => (
                <tr key={ev.date}>
                  <td>
                    {new Date(ev.date).toLocaleDateString('ru-RU')}
                    {ev.date === position.maturityDate && <Badge tone="warning" size="sm" style={{ marginLeft: 8 }}>Погашение</Badge>}
                  </td>
                  <td className="r ia-num">{ev.valuePrc.toFixed(2)}%</td>
                  <td className="r ia-num">{formatPrice(ev.value, position.currency)}</td>
                  <td className="r ia-num">{formatPrice(ev.value * position.quantity, position.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="ia-row-detail__group">
        <div className="ia-row-detail__title">Динамика цены</div>
        <Sparkline data={sparkline} />
      </div>
    </div>
  )
}

function BondTableRow({ row, expanded, onToggle, sparkline, openModal, onDelete }: {
  row: BondRow
  expanded: boolean
  onToggle: () => void
  sparkline: number[]
  openModal: (m: ActiveModal) => void
  onDelete: (position: Position) => void
}) {
  const { position } = row
  return (
    <React.Fragment>
      <tr style={{ cursor: 'pointer' }} onClick={onToggle}>
        <td style={{ width: 36 }}><RowToggle open={expanded} onClick={onToggle} /></td>
        <td>
          <div className="ia-cell-tk">
            <Avatar name={position.ticker} size="sm" color="var(--ink-600)" />
            <div>
              <div className="ia-cell-tk__t ia-mono">{position.ticker}</div>
              <div className="ia-cell-tk__n">{position.name ?? position.ticker}</div>
            </div>
          </div>
        </td>
        <td className="r ia-num">{NUM0.format(position.quantity)}</td>
        <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
        <td className="r">
          {row.totalPnl !== 0
            ? <PnLValue value={row.totalPnl} percent={row.totalPnlPercent} display="both" size="sm" />
            : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>нет цены</span>}
        </td>
        <td className="r">
          {row.ytm != null
            ? <Badge tone="positive" size="sm">{row.ytm.toFixed(1)}%</Badge>
            : <span>—</span>}
        </td>
        <td className="ia-num" style={{ color: 'var(--text-3)' }}>
          {position.maturityDate ? new Date(position.maturityDate).toLocaleDateString('ru-RU') : '—'}
        </td>
        <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.assetTypeWeight.toFixed(1)}%</td>
        <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
        <td className="r">
          <RowActionsMenu actions={buildPositionActions(position, openModal, onDelete)} />
        </td>
      </tr>
      {expanded && (
        <tr className="ia-row-detail">
          <td colSpan={10}><BondDetailPanel row={row} sparkline={sparkline} /></td>
        </tr>
      )}
    </React.Fragment>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export function PortfolioPage() {
  const [tab, setTab] = useState('summary')
  const { summary, accounts, isLoading } = usePortfolio()
  const selectedAccountId = usePortfolioStore((s) => s.selectedAccountId)
  const setSelectedAccountId = usePortfolioStore((s) => s.setSelectedAccountId)
  const bump = usePortfolioStore((s) => s.bump)
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({})
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null)
  const fetchedTickersRef = useRef<Set<string>>(new Set())

  const { sort: eqSort, toggle: toggleEqSort } = useTableSort<EqSortKey>()
  const eqSortProps = makeSortProps(eqSort, toggleEqSort)
  const { sort: bondSort, toggle: toggleBondSort } = useTableSort<BondSortKey>()
  const bondSortProps = makeSortProps(bondSort, toggleBondSort)
  const { sort: cashSort, toggle: toggleCashSort } = useTableSort<CashSortKey>()
  const cashSortProps = makeSortProps(cashSort, toggleCashSort)

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDeletePosition(position: Position) {
    if (!window.confirm(`Удалить позицию ${position.ticker}? Это действие нельзя отменить.`)) return
    await deletePosition(position.id)
    bump()
  }

  useEffect(() => {
    if (isLoading) return
    if (selectedAccountId && !accounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(null)
    }
  }, [accounts, isLoading, selectedAccountId, setSelectedAccountId])

  const equityTickersKey = Array.from(
    new Set(accounts.flatMap((a) => a.equityRows.map((r) => r.position.ticker)))
  ).sort().join(',')

  const bondTickersKey = Array.from(
    new Set(accounts.flatMap((a) => a.bondRows.map((r) => r.position.ticker)))
  ).sort().join(',')

  const cashCurrenciesKey = Array.from(
    new Set(accounts.flatMap((a) => a.cashRows.map((r) => r.balance.currency)).filter((c) => c !== 'RUB'))
  ).sort().join(',')

  useEffect(() => {
    const equityTickers = equityTickersKey ? equityTickersKey.split(',') : []
    const bondTickers = bondTickersKey ? bondTickersKey.split(',') : []
    const currencies = cashCurrenciesKey ? cashCurrenciesKey.split(',') : []
    const toFetch = [
      ...equityTickers.filter((t) => !fetchedTickersRef.current.has(t)).map((t) => ({ key: t, ticker: t, assetType: 'equity' as const })),
      ...bondTickers.filter((t) => !fetchedTickersRef.current.has(t)).map((t) => ({ key: t, ticker: t, assetType: 'bond' as const })),
      ...currencies.filter((c) => !fetchedTickersRef.current.has(`cur:${c}`)).map((c) => ({ key: `cur:${c}`, ticker: c, assetType: 'currency' as const })),
    ]
    if (toFetch.length === 0) return
    toFetch.forEach(({ key }) => fetchedTickersRef.current.add(key))
    Promise.all(
      toFetch.map(({ key, ticker, assetType }) =>
        getPriceHistory(ticker, assetType)
          .then((r): readonly [string, number[]] => [key, r.prices])
          .catch((): readonly [string, number[]] => [key, []])
      )
    ).then((entries) => {
      setPriceHistory((prev) => {
        const next = { ...prev }
        for (const [k, prices] of entries) next[k] = prices
        return next
      })
    })
  }, [equityTickersKey, bondTickersKey, cashCurrenciesKey])

  if (isLoading) return <div className="ia-screen"><Spinner /></div>

  const hasPositions = accounts.some((a) => a.equityRows.length + a.bondRows.length > 0)
  if (!summary || !hasPositions) return <div className="ia-screen"><EmptyState /></div>

  const selectedAccount = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) ?? null : null
  const filteredAccounts = selectedAccount ? [selectedAccount] : accounts

  if (selectedTicker) {
    return <AssetDetailPage ticker={selectedTicker} accounts={filteredAccounts} onBack={() => setSelectedTicker(null)} />
  }

  const allEquities = filteredAccounts.flatMap((a) => a.equityRows)
  const allBonds = filteredAccounts.flatMap((a) => a.bondRows)
  const allCash = filteredAccounts.flatMap((a) => a.cashRows)

  const viewSummary = selectedAccount
    ? {
        ...summary,
        totalValue: selectedAccount.totalValue,
        investedValue: selectedAccount.investedValue,
        dayChange: selectedAccount.dayChange,
        equityValue: allEquities.reduce((s, r) => s + r.currentValue, 0),
        bondValue: allBonds.reduce((s, r) => s + r.currentValue, 0),
        cashValue: allCash.reduce((s, r) => s + r.rubEquivalent, 0),
        unrealizedPnl: selectedAccount.unrealizedPnl,
        unrealizedPnlPercent: selectedAccount.unrealizedPnlPercent,
      }
    : summary

  const allocSegments = [
    { label: 'Акции', value: viewSummary.equityValue },
    { label: 'Облигации', value: viewSummary.bondValue },
    { label: 'Деньги', value: viewSummary.cashValue },
  ]

  const totalEquities = filteredAccounts.flatMap((a) => a.equityRows)

  return (
    <div className="ia-screen">
      {/* Верхний блок: Сводка + ИИ-аналитик */}
      <div className="ia-grid-top">
        <Card>
          <div className="ia-eyebrow" style={{ marginBottom: 10 }}>
            {selectedAccount ? `Портфель «${selectedAccount.name}»` : 'Сводка портфеля'}
          </div>
          <StatCard
            size="xl"
            label="Стоимость"
            value={money(viewSummary.totalValue)}
            delta={viewSummary.unrealizedPnl}
            deltaPercent={viewSummary.unrealizedPnlPercent}
            caption="нереализованный P&L"
          />
          <div className="ia-summ-row">
            <div>
              <div className="ia-summ-k">Инвестировано</div>
              <div className="ia-summ-v ia-num">{money(viewSummary.investedValue)}</div>
            </div>
            <div>
              <div className="ia-summ-k">Изм. за день</div>
              <div className="ia-summ-v">
                {viewSummary.dayChange !== 0
                  ? <PnLValue value={viewSummary.dayChange} display="money" size="md" />
                  : <span className="ia-num" style={{ color: 'var(--text-3)' }}>—</span>}
              </div>
            </div>
            <div>
              <div className="ia-summ-k">Акции</div>
              <div className="ia-summ-v ia-num">{money(viewSummary.equityValue)}</div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Состав</div>
            <AllocationBar size="lg" segments={allocSegments} />
          </div>
        </Card>

        <Card className="ia-ai-aside">
          <div className="ia-ai-aside__head">
            <Sparkles size={16} /><span>Аналитик заметил</span>
          </div>
          {totalEquities.map((row) => {
            if (row.portfolioWeight > 25) {
              return (
                <div key={row.position.id} className="ia-signal ia-signal--warn">
                  <span className="ia-signal__emoji">⚠️</span>
                  <div>
                    <b>{row.position.ticker} — {row.portfolioWeight.toFixed(1)}% портфеля</b>
                    <p>Высокая концентрация в одном эмитенте увеличивает риск.</p>
                    <Button variant="soft" size="sm">Ребалансировать</Button>
                  </div>
                </div>
              )
            }
            return null
          })}
          <div className="ia-signal">
            <span className="ia-signal__emoji">📊</span>
            <div>
              <b>Портфель собран</b>
              <p>Добавьте текущие рыночные цены через обновление позиций, чтобы видеть актуальный P&L.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Таблицы с вкладками */}
      <Card tightBody>
        <div className="ia-table-head">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'summary', label: 'Сводный отчёт' },
              { value: 'all', label: 'Все активы', count: allEquities.length + allBonds.length },
              { value: 'eq', label: 'Акции', count: allEquities.length },
              { value: 'bond', label: 'Облигации', count: allBonds.length },
              { value: 'cash', label: 'Деньги' },
            ]}
          />
          <div className="ia-table-head__r">
            <IconButton variant="outlined" label="Экспорт"><Download size={16} /></IconButton>
          </div>
        </div>

        {/* ── Сводный отчёт ── */}
        {tab === 'summary' && (
          <SummaryReportTable accounts={filteredAccounts} totalValue={viewSummary.totalValue} onSelectTicker={setSelectedTicker} />
        )}

        {/* ── Все активы ── */}
        {tab === 'all' && (
          <AllAssetsTable accounts={filteredAccounts} openModal={setActiveModal} onDelete={handleDeletePosition} />
        )}

        {/* ── Акции ── */}
        {tab === 'eq' && (
          allEquities.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Акции не найдены</div>
            : <table className="ia-table ia-table--compact">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <SortTh align="left" {...eqSortProps('name')}>Акция</SortTh>
                    <SortTh {...eqSortProps('quantity')}>Кол-во</SortTh>
                    <SortTh {...eqSortProps('currentPrice')}>Тек. цена, ₽</SortTh>
                    <SortTh {...eqSortProps('currentValue')}>Тек. стоимость, ₽</SortTh>
                    <SortTh {...eqSortProps('pnl')}>Прибыль</SortTh>
                    <SortTh {...eqSortProps('dayChange')}>Изм. за день</SortTh>
                    <SortTh {...eqSortProps('assetTypeWeight')}>% от акций</SortTh>
                    <SortTh {...eqSortProps('portfolioWeight')}>Доля</SortTh>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortRows(allEquities, eqSort, equitySortValue).map((row) => (
                    <EquityTableRow
                      key={row.position.id}
                      row={row}
                      expanded={expandedRows.has(row.position.id)}
                      onToggle={() => toggleRow(row.position.id)}
                      onSelectTicker={setSelectedTicker}
                      sparkline={priceHistory[row.position.ticker] ?? []}
                      openModal={setActiveModal}
                      onDelete={handleDeletePosition}
                    />
                  ))}
                </tbody>
              </table>
        )}

        {/* ── Облигации ── */}
        {tab === 'bond' && (
          allBonds.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Облигации не найдены</div>
            : <table className="ia-table ia-table--compact">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <SortTh align="left" {...bondSortProps('name')}>Выпуск</SortTh>
                    <SortTh {...bondSortProps('quantity')}>Кол-во</SortTh>
                    <SortTh {...bondSortProps('currentValue')}>Тек. стоимость</SortTh>
                    <SortTh {...bondSortProps('totalPnl')}>Сум. прибыль</SortTh>
                    <SortTh {...bondSortProps('ytm')}>YTM</SortTh>
                    <SortTh align="left" {...bondSortProps('maturityDate')}>Погашение</SortTh>
                    <SortTh {...bondSortProps('assetTypeWeight')}>% от облигаций</SortTh>
                    <SortTh {...bondSortProps('portfolioWeight')}>Доля</SortTh>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortRows(allBonds, bondSort, bondSortValue).map((row) => (
                    <BondTableRow
                      key={row.position.id}
                      row={row}
                      expanded={expandedRows.has(row.position.id)}
                      onToggle={() => toggleRow(row.position.id)}
                      sparkline={priceHistory[row.position.ticker] ?? []}
                      openModal={setActiveModal}
                      onDelete={handleDeletePosition}
                    />
                  ))}
                </tbody>
              </table>
        )}

        {/* ── Деньги ── */}
        {tab === 'cash' && (
          allCash.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Денежные остатки не учтены</div>
            : <table className="ia-table ia-table--compact">
                <thead>
                  <tr>
                    <SortTh align="left" {...cashSortProps('currency')}>Валюта</SortTh>
                    <SortTh {...cashSortProps('amount')}>Сумма</SortTh>
                    <SortTh {...cashSortProps('rate')}>Тек. цена, ₽</SortTh>
                    <SortTh {...cashSortProps('rubEquivalent')}>Тек. стоимость, ₽</SortTh>
                    <SortTh {...cashSortProps('portfolioWeight')}>Доля</SortTh>
                    <th>Динамика</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortRows(allCash, cashSort, cashSortValue).map((row, i) => (
                    <tr key={i}>
                      <td>
                        <div className="ia-cell-tk">
                          <Avatar name={row.balance.currency} size="sm" color="var(--ink-600)" />
                          <div className="ia-cell-tk__t ia-mono">{row.balance.currency}</div>
                        </div>
                      </td>
                      <td className="r ia-num">{RUB.format(row.balance.amount)}</td>
                      <td className="r ia-num">{RUB.format(row.rate)}</td>
                      <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.rubEquivalent)}</td>
                      <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
                      <td>
                        {row.balance.currency !== 'RUB'
                          ? <Sparkline data={priceHistory[`cur:${row.balance.currency}`] ?? []} />
                          : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td className="r">
                        <RowActionsMenu actions={buildCashActions(row, setActiveModal)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}
      </Card>

      {/* ── Модалки контекстного меню «⋮» ── */}
      {activeModal?.kind === 'trades' && (
        <TradesListModal
          open
          onClose={() => setActiveModal(null)}
          accountId={activeModal.accountId}
          ticker={activeModal.ticker}
          name={activeModal.name}
        />
      )}
      {activeModal?.kind === 'notes' && (
        <NotesModal
          open
          onClose={() => setActiveModal(null)}
          positionId={activeModal.positionId}
          ticker={activeModal.ticker}
          name={activeModal.name}
        />
      )}
      {activeModal?.kind === 'trade' && (
        <TradeModal
          open
          onClose={() => setActiveModal(null)}
          initial={activeModal.initial}
        />
      )}
      {activeModal?.kind === 'payment' && (
        <PaymentRecordModal
          open
          onClose={() => setActiveModal(null)}
          accountId={activeModal.accountId}
          position={activeModal.position}
        />
      )}
      {activeModal?.kind === 'editQty' && (
        <EditQuantityModal
          open
          onClose={() => setActiveModal(null)}
          position={activeModal.position}
        />
      )}
      {activeModal?.kind === 'transfer' && (
        <TransferPositionModal
          open
          onClose={() => setActiveModal(null)}
          position={activeModal.position}
        />
      )}
      {activeModal?.kind === 'deposit' && (
        <DepositModal
          open
          onClose={() => setActiveModal(null)}
          initial={activeModal.initial}
        />
      )}
    </div>
  )
}
