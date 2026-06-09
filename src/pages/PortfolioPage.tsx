import React, { useState } from 'react'
import { Card, StatCard, PnLValue, Badge, AllocationBar, Avatar, Tabs, Button, IconButton, Select } from '../components'
import { Sparkles, Download, PackageOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { usePortfolioStore } from '../store/portfolioStore'
import type { AccountSummary } from '@/types'

const RUB = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NUM0 = new Intl.NumberFormat('ru-RU')
const money = (v: number) => RUB.format(v) + ' ₽'

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

function SummaryReportTable({ accounts, totalValue }: { accounts: AccountSummary[]; totalValue: number }) {
  // expandedAccounts: какие счета раскрыты
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(accounts.map((a) => a.id))
  )
  // expandedTypes: какие подгруппы (accId-eq / accId-bond) раскрыты
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const toggleAcc = (id: string) =>
    setExpandedAccounts((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleType = (key: string) =>
    setExpandedTypes((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  const R: React.CSSProperties = { textAlign: 'right', whiteSpace: 'nowrap' }

  return (
    <table className="ia-table">
      <thead>
        <tr>
          <th style={{ width: '30%' }}>Название</th>
          <th style={R}>Стоимость</th>
          <th style={R}>Инвестировано</th>
          <th style={R}>Прибыль, ₽</th>
          <th style={R}>Прибыль, %</th>
          <th style={R}>Изм. за день</th>
          <th style={R}>Доля, %</th>
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

          const bondValue    = acc.bondRows.reduce((s, r) => s + r.currentValue, 0)
          const bondInvested = acc.bondRows.reduce((s, r) => s + r.investedValue, 0)
          const bondPnl      = acc.bondRows.reduce((s, r) => s + r.unrealizedPnl, 0)
          const bondDayChange = acc.bondRows.some((r) => r.dayChange != null)
            ? acc.bondRows.reduce((s, r) => s + (r.dayChange ?? 0), 0) : null

          const accShare = totalValue > 0 ? (acc.totalValue / totalValue) * 100 : 0

          return (
            <React.Fragment key={acc.id}>
              {/* ── Уровень 1: Счёт ── */}
              <tr style={{ cursor: 'pointer', background: 'var(--surface-sunken)' }} onClick={() => toggleAcc(acc.id)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-1)' }}>
                    {accOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {acc.name}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)', fontWeight: 400 }}>{acc.broker}</span>
                  </div>
                </td>
                <td className="r ia-num" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{money(acc.totalValue)}</td>
                <td className="r ia-num">{money(acc.investedValue)}</td>
                <td className="r"><PnLValue value={acc.unrealizedPnl} display="money" size="sm" /></td>
                <td className="r"><PnLValue percent={acc.unrealizedPnlPercent} display="percent" size="sm" /></td>
                <td className="r"><DashCell value={acc.dayChange !== 0 ? acc.dayChange : null} /></td>
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
                  <td className="r ia-num">{money(equityValue)}</td>
                  <td className="r ia-num">{money(equityInvested)}</td>
                  <td className="r"><PnLValue value={equityPnl} display="money" size="sm" /></td>
                  <td className="r">
                    <DashCell value={equityInvested > 0 ? (equityPnl / equityInvested) * 100 : null} />
                  </td>
                  <td className="r"><DashCell value={equityDayChange} /></td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>
                    {totalValue > 0 ? RUB.format((equityValue / totalValue) * 100) : '0,00'}%
                  </td>
                </tr>
              )}

              {/* ── Уровень 3: Каждая акция ── */}
              {accOpen && eqOpen && acc.equityRows.map((row) => {
                const share = totalValue > 0 ? (row.currentValue / totalValue) * 100 : 0
                return (
                  <tr key={row.position.id} style={{ opacity: 0.95 }}>
                    <td style={{ paddingLeft: 56 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={row.position.ticker} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{row.position.ticker}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{row.position.name ?? row.position.ticker}</div>
                        </div>
                      </div>
                    </td>
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
                    <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(share)}%</td>
                  </tr>
                )
              })}

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
                  <td className="r ia-num">{money(bondValue)}</td>
                  <td className="r ia-num">{money(bondInvested)}</td>
                  <td className="r"><PnLValue value={bondPnl} display="money" size="sm" /></td>
                  <td className="r">
                    <DashCell value={bondInvested > 0 ? (bondPnl / bondInvested) * 100 : null} />
                  </td>
                  <td className="r"><DashCell value={bondDayChange} /></td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>
                    {totalValue > 0 ? RUB.format((bondValue / totalValue) * 100) : '0,00'}%
                  </td>
                </tr>
              )}

              {/* ── Уровень 3: Каждая облигация ── */}
              {accOpen && bondOpen && acc.bondRows.map((row) => {
                const share = totalValue > 0 ? (row.currentValue / totalValue) * 100 : 0
                return (
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
                    <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{RUB.format(share)}%</td>
                  </tr>
                )
              })}

              {/* ── Уровень 2: Деньги ── */}
              {accOpen && acc.cashRows.length > 0 && (
                <tr>
                  <td style={{ paddingLeft: 32, color: 'var(--text-2)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ChevronRight size={13} style={{ opacity: 0.3 }} />
                      Денежные средства
                    </div>
                  </td>
                  <td className="r ia-num">{money(acc.cashRows.reduce((s: number, r: { rubEquivalent: number }) => s + r.rubEquivalent, 0))}</td>
                  <td colSpan={5} style={{ color: 'var(--text-4)', textAlign: 'right', fontSize: 'var(--text-xs)' }}>—</td>
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

function AllAssetsTable({ accounts }: { accounts: AccountSummary[] }) {
  const allRows = accounts.flatMap((acc) => [
    ...acc.equityRows.map((r) => ({ ...r, accountName: acc.name, type: 'equity' as const })),
    ...acc.bondRows.map((r) => ({ ...r, accountName: acc.name, type: 'bond' as const })),
  ]).sort((a, b) => b.currentValue - a.currentValue)

  if (allRows.length === 0) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Нет позиций</div>
  }

  return (
    <table className="ia-table">
      <thead>
        <tr>
          <th>Тикер</th>
          <th>Тип</th>
          <th style={{ textAlign: 'right' }}>Кол-во</th>
          <th style={{ textAlign: 'right' }}>Стоимость</th>
          <th style={{ textAlign: 'right' }}>Инвестировано</th>
          <th style={{ textAlign: 'right' }}>Прибыль</th>
          <th style={{ textAlign: 'right' }}>Изм. за день</th>
          <th style={{ textAlign: 'right' }}>Вес</th>
          <th>Счёт</th>
        </tr>
      </thead>
      <tbody>
        {allRows.map((row) => {
          const pnl = row.type === 'equity' ? row.unrealizedPnl : (row as { unrealizedPnl: number }).unrealizedPnl
          const pnlPct = row.unrealizedPnlPercent
          return (
            <tr key={row.position.id}>
              <td>
                <div className="ia-cell-tk">
                  <Avatar name={row.position.ticker} size="sm" color={row.type === 'bond' ? 'var(--ink-600)' : undefined} />
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
              <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
              <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{row.accountName}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export function PortfolioPage() {
  const [tab, setTab] = useState('summary')
  const [equityAccountFilter, setEquityAccountFilter] = useState('all')
  const { summary, accounts, isLoading } = usePortfolio()

  if (isLoading) return <div className="ia-screen"><Spinner /></div>

  const hasPositions = accounts.some((a) => a.equityRows.length + a.bondRows.length > 0)
  if (!summary || !hasPositions) return <div className="ia-screen"><EmptyState /></div>

  const filteredAccounts = equityAccountFilter === 'all'
    ? accounts
    : accounts.filter((a) => a.id === equityAccountFilter)

  const allEquities = filteredAccounts.flatMap((a) => a.equityRows)
  const allBonds = filteredAccounts.flatMap((a) => a.bondRows)
  const allCash = filteredAccounts.flatMap((a) => a.cashRows)

  const allocSegments = [
    { label: 'Акции', value: summary.equityValue },
    { label: 'Облигации', value: summary.bondValue },
    { label: 'Деньги', value: summary.cashValue },
  ]

  const totalEquities = accounts.flatMap((a) => a.equityRows)

  return (
    <div className="ia-screen">
      {/* Верхний блок: Сводка + ИИ-аналитик */}
      <div className="ia-grid-top">
        <Card>
          <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Сводка портфеля</div>
          <StatCard
            size="xl"
            label="Стоимость"
            value={money(summary.totalValue)}
            delta={summary.unrealizedPnl}
            deltaPercent={summary.unrealizedPnlPercent}
            caption="нереализованный P&L"
          />
          <div className="ia-summ-row">
            <div>
              <div className="ia-summ-k">Инвестировано</div>
              <div className="ia-summ-v ia-num">{money(summary.investedValue)}</div>
            </div>
            <div>
              <div className="ia-summ-k">Изм. за день</div>
              <div className="ia-summ-v">
                {summary.dayChange !== 0
                  ? <PnLValue value={summary.dayChange} display="money" size="md" />
                  : <span className="ia-num" style={{ color: 'var(--text-3)' }}>—</span>}
              </div>
            </div>
            <div>
              <div className="ia-summ-k">Акции</div>
              <div className="ia-summ-v ia-num">{money(summary.equityValue)}</div>
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
              { value: 'all', label: 'Все активы', count: accounts.flatMap((a) => [...a.equityRows, ...a.bondRows]).length },
              { value: 'eq', label: 'Акции', count: accounts.flatMap((a) => a.equityRows).length },
              { value: 'bond', label: 'Облигации', count: accounts.flatMap((a) => a.bondRows).length },
              { value: 'cash', label: 'Деньги' },
            ]}
          />
          <div className="ia-table-head__r">
            {tab !== 'summary' && (
              <Select size="sm" value={equityAccountFilter} onChange={(e) => setEquityAccountFilter(e.target.value)}>
                <option value="all">Все счета</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            )}
            <IconButton variant="outlined" label="Экспорт"><Download size={16} /></IconButton>
          </div>
        </div>

        {/* ── Сводный отчёт ── */}
        {tab === 'summary' && (
          <SummaryReportTable accounts={accounts} totalValue={summary.totalValue} />
        )}

        {/* ── Все активы ── */}
        {tab === 'all' && (
          <AllAssetsTable accounts={filteredAccounts} />
        )}

        {/* ── Акции ── */}
        {tab === 'eq' && (
          allEquities.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Акции не найдены</div>
            : <table className="ia-table">
                <thead>
                  <tr>
                    <th>Тикер</th>
                    <th className="r">Кол-во</th>
                    <th className="r">Средняя</th>
                    <th className="r">Цена</th>
                    <th className="r">Стоимость</th>
                    <th className="r">Инвестировано</th>
                    <th className="r">P&L</th>
                    <th className="r">Изм. за день</th>
                    <th className="r">Вес</th>
                  </tr>
                </thead>
                <tbody>
                  {allEquities.map((row) => (
                    <tr key={row.position.id}>
                      <td>
                        <div className="ia-cell-tk">
                          <Avatar name={row.position.ticker} size="sm" />
                          <div>
                            <div className="ia-cell-tk__t ia-mono">{row.position.ticker}</div>
                            <div className="ia-cell-tk__n">{row.position.name ?? row.position.ticker}</div>
                          </div>
                        </div>
                      </td>
                      <td className="r ia-num">{NUM0.format(row.position.quantity)}</td>
                      <td className="r ia-num">{RUB.format(row.position.averagePrice)}</td>
                      <td className="r ia-num">{RUB.format(row.currentPrice)}</td>
                      <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
                      <td className="r ia-num">{money(row.investedValue)}</td>
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
                      <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {/* ── Облигации ── */}
        {tab === 'bond' && (
          allBonds.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Облигации не найдены</div>
            : <table className="ia-table">
                <thead>
                  <tr>
                    <th>Выпуск</th>
                    <th className="r">Кол-во</th>
                    <th className="r">Стоимость</th>
                    <th className="r">Инвестировано</th>
                    <th className="r">Прибыль</th>
                    <th className="r">Изм. за день</th>
                    <th className="r">Купон %</th>
                    <th className="r">YTM</th>
                    <th>Погашение</th>
                  </tr>
                </thead>
                <tbody>
                  {allBonds.map((row) => (
                    <tr key={row.position.id}>
                      <td>
                        <div className="ia-cell-tk">
                          <Avatar name={row.position.ticker} size="sm" color="var(--ink-600)" />
                          <div>
                            <div className="ia-cell-tk__t ia-mono">{row.position.ticker}</div>
                            <div className="ia-cell-tk__n">{row.position.name ?? row.position.ticker}</div>
                          </div>
                        </div>
                      </td>
                      <td className="r ia-num">{NUM0.format(row.position.quantity)}</td>
                      <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
                      <td className="r ia-num">{money(row.investedValue)}</td>
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
                      <td className="r ia-num">{row.position.couponRate != null ? row.position.couponRate.toFixed(2) + '%' : '—'}</td>
                      <td className="r">
                        {row.ytm != null
                          ? <Badge tone="positive" size="sm">{row.ytm.toFixed(1)}%</Badge>
                          : <span>—</span>}
                      </td>
                      <td className="ia-num" style={{ color: 'var(--text-3)' }}>
                        {row.position.maturityDate
                          ? new Date(row.position.maturityDate).toLocaleDateString('ru-RU')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {/* ── Деньги ── */}
        {tab === 'cash' && (
          allCash.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Денежные остатки не учтены</div>
            : <div className="ia-cash">
                {allCash.map((row, i) => (
                  <div key={i} className="ia-cash__row">
                    <span className="ia-mono">{row.balance.currency}</span>
                    <span className="ia-num">{money(row.rubEquivalent)}</span>
                  </div>
                ))}
              </div>
        )}
      </Card>
    </div>
  )
}
