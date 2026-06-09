import { useState } from 'react'
import { Card, StatCard, PnLValue, Badge, AllocationBar, Avatar, Tabs, Button, IconButton, Select } from '../components'
import { Sparkles, Download, PackageOpen } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { usePortfolioStore } from '../store/portfolioStore'

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

export function PortfolioPage() {
  const [tab, setTab] = useState('eq')
  const { summary, accounts, isLoading } = usePortfolio()

  if (isLoading) return <div className="ia-screen"><Spinner /></div>

  const hasPositions = accounts.some((a) => a.equityRows.length + a.bondRows.length > 0)
  if (!summary || !hasPositions) return <div className="ia-screen"><EmptyState /></div>

  const allEquities = accounts.flatMap((a) => a.equityRows)
  const allBonds = accounts.flatMap((a) => a.bondRows)
  const allCash = accounts.flatMap((a) => a.cashRows)

  const allocSegments = [
    { label: 'Акции', value: summary.equityValue },
    { label: 'Облигации', value: summary.bondValue },
    { label: 'Деньги', value: summary.cashValue },
  ]

  return (
    <div className="ia-screen">
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
              <div className="ia-summ-k">Акции</div>
              <div className="ia-summ-v ia-num">{money(summary.equityValue)}</div>
            </div>
            <div>
              <div className="ia-summ-k">Облигации</div>
              <div className="ia-summ-v ia-num">{money(summary.bondValue)}</div>
            </div>
            <div>
              <div className="ia-summ-k">Деньги</div>
              <div className="ia-summ-v ia-num">{money(summary.cashValue)}</div>
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
          {allEquities.map((row) => {
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

      <Card tightBody>
        <div className="ia-table-head">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'eq', label: 'Акции', count: allEquities.length },
              { value: 'bond', label: 'Облигации', count: allBonds.length },
              { value: 'cash', label: 'Деньги' },
            ]}
          />
          <div className="ia-table-head__r">
            <Select size="sm" defaultValue="all">
              <option value="all">Все счета</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <IconButton variant="outlined" label="Экспорт"><Download size={16} /></IconButton>
          </div>
        </div>

        {tab === 'eq' && (
          allEquities.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Акции не найдены</div>
            : <table className="ia-table">
                <thead>
                  <tr>
                    <th>Тикер</th><th className="r">Кол-во</th><th className="r">Средняя</th>
                    <th className="r">Цена</th><th className="r">Стоимость</th>
                    <th className="r">P&L</th><th className="r">Вес</th>
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
                      <td className="r">
                        {row.unrealizedPnl !== 0
                          ? <PnLValue value={row.unrealizedPnl} percent={row.unrealizedPnlPercent} display="both" size="sm" />
                          : <span style={{ color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>нет цены</span>}
                      </td>
                      <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {tab === 'bond' && (
          allBonds.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Облигации не найдены</div>
            : <table className="ia-table">
                <thead>
                  <tr>
                    <th>Выпуск</th><th className="r">Кол-во</th><th className="r">Цена %</th>
                    <th className="r">Стоимость</th><th className="r">Купон %</th>
                    <th className="r">YTM</th><th>Погашение</th>
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
                      <td className="r ia-num">{row.currentPrice.toFixed(2)}</td>
                      <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
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
