import { useState } from 'react'
import { Card, StatCard, PnLValue, Badge, AllocationBar, Avatar, Tabs, Button, IconButton, Select } from '../components'
import { Sparkles, Download } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'

const RUB = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NUM0 = new Intl.NumberFormat('ru-RU')
const money = (v: number) => RUB.format(v) + ' ₽'

export function PortfolioPage() {
  const [tab, setTab] = useState('eq')
  const { summary, accounts } = usePortfolio()

  if (!summary) return null

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
          <div className="ia-signal ia-signal--warn">
            <span className="ia-signal__emoji">⚠️</span>
            <div>
              <b>LKOH — 28,9% портфеля</b>
              <p>Выше цели 12%. Высокая концентрация в одном эмитенте увеличивает риск.</p>
              <Button variant="soft" size="sm">Ребалансировать</Button>
            </div>
          </div>
          <div className="ia-signal">
            <span className="ia-signal__emoji">📅</span>
            <div><b>SBER: дивиденд через 4 дня</b><p>~12,50 ₽ на акцию · ожидается ~6 250 ₽ до налогов.</p></div>
          </div>
          <div className="ia-signal">
            <span className="ia-signal__emoji">🧾</span>
            <div><b>GAZP в минусе −25 530 ₽</b><p>Можно зафиксировать убыток до конца года и уменьшить налог.</p></div>
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
          <table className="ia-table">
            <thead>
              <tr>
                <th>Тикер</th><th className="r">Кол-во</th><th className="r">Средняя</th>
                <th className="r">Цена</th><th className="r">Стоимость</th>
                <th className="r">Доход</th><th className="r">Вес</th>
              </tr>
            </thead>
            <tbody>
              {allEquities.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div className="ia-cell-tk">
                      <Avatar name={row.position.ticker} size="sm" />
                      <div>
                        <div className="ia-cell-tk__t ia-mono">{row.position.ticker}</div>
                        <div className="ia-cell-tk__n">{row.position.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="r ia-num">{NUM0.format(row.position.quantity)}</td>
                  <td className="r ia-num">{RUB.format(row.position.averagePrice)}</td>
                  <td className="r ia-num">{RUB.format(row.currentPrice)}</td>
                  <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{money(row.currentValue)}</td>
                  <td className="r"><PnLValue value={row.unrealizedPnl} percent={row.unrealizedPnlPercent} display="both" size="sm" /></td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{row.portfolioWeight.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'bond' && (
          <table className="ia-table">
            <thead>
              <tr>
                <th>Выпуск</th><th className="r">Кол-во</th><th className="r">Цена</th>
                <th className="r">Стоимость</th><th className="r">Купон %</th>
                <th className="r">YTM</th><th>Погашение</th>
              </tr>
            </thead>
            <tbody>
              {allBonds.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div className="ia-cell-tk">
                      <Avatar name={row.position.ticker} size="sm" color="var(--ink-600)" />
                      <div>
                        <div className="ia-cell-tk__t ia-mono">{row.position.ticker}</div>
                        <div className="ia-cell-tk__n">{row.position.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="r ia-num">{NUM0.format(row.position.quantity)}</td>
                  <td className="r ia-num">{RUB.format(row.currentPrice)}</td>
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
          <div className="ia-cash">
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
