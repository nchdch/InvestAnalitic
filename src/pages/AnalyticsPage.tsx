import { Layers, TrendingUp, CalendarClock, Banknote, PieChart, Wallet, Activity, Percent, Target } from 'lucide-react'
import { Card, StatCard, Badge, PnLValue, BarChart, DonutChart } from '../components'
import { usePortfolio } from '../hooks/usePortfolio'
import { useAnalytics } from '../hooks/useAnalytics'
import { formatRub } from '../utils/format'
import type { AssetType } from '@/types'

const PCT2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const YEARS1 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const HHI_LABEL: Record<'low' | 'moderate' | 'high', string> = {
  low: 'Низкая концентрация',
  moderate: 'Умеренная концентрация',
  high: 'Высокая концентрация',
}

const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  equity: 'Акция',
  bond: 'Облигация',
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

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '64px 24px', textAlign: 'center', color: 'var(--text-3)',
    }}>
      <PieChart size={40} strokeWidth={1.2} color="var(--text-4)" />
      <div style={{ fontSize: 'var(--text-base)' }}>{text}</div>
    </div>
  )
}

export function AnalyticsPage() {
  const { summary, accounts, isLoading: portfolioLoading } = usePortfolio()
  const a = useAnalytics(accounts, summary?.totalValue ?? 0)
  const loading = portfolioLoading || a.isLoading

  if (loading) return <div className="ia-screen"><Spinner /></div>
  if (!summary || a.positionsCount === 0) {
    return <div className="ia-screen"><Empty text="Недостаточно данных для аналитики — добавьте позиции в портфель, чтобы увидеть метрики качества." /></div>
  }

  const prevValue = summary.totalValue - summary.dayChange
  const dayChangePercent = prevValue !== 0 ? (summary.dayChange / prevValue) * 100 : null

  const chartData = a.monthlyIncome.map((m) => ({
    label: m.label,
    segments: [
      { value: m.dividends, color: 'var(--azure-500)' },
      { value: m.coupons, color: 'var(--violet-500)' },
    ],
  }))

  return (
    <div className="ia-screen">
      <div className="ia-an-top">
        <Card title="Состав портфеля по бумагам" subtitle="Доля от текущей стоимости позиций">
          <DonutChart data={a.composition} />
        </Card>
        <Card title="Портфель">
          <div className="ia-an-quickstats">
            <StatCard
              label="Стоимость портфеля"
              value={formatRub(summary.totalValue)}
              icon={<Wallet size={15} />}
            />
            <StatCard
              label="Изменение за день"
              value={<PnLValue value={summary.dayChange} percent={dayChangePercent} display="both" size="lg" />}
              icon={<Activity size={15} />}
            />
            <StatCard
              label="Доходность портфеля"
              value={<PnLValue value={summary.unrealizedPnl} percent={summary.unrealizedPnlPercent} display="percent" size="lg" />}
              icon={<Percent size={15} />}
              caption="Нереализованный P&L к вложенным средствам"
            />
            <StatCard
              label="Альфа портфеля"
              value="—"
              icon={<Target size={15} />}
              caption="Нет данных бенчмарка для расчёта"
            />
          </div>
        </Card>
      </div>

      <div className="ia-stats-grid">
        <Card>
          <StatCard
            label="Концентрация (HHI)"
            value={a.hhi != null ? a.hhi.toFixed(3) : '—'}
            icon={<Layers size={15} />}
            caption={a.hhiLevel ? `${HHI_LABEL[a.hhiLevel]} · ${a.positionsCount} поз.` : undefined}
          />
        </Card>
        <Card>
          <StatCard
            label="Средневзв. YTM облигаций"
            value={a.weightedYtm != null ? PCT2.format(a.weightedYtm) : '—'}
            unit={a.weightedYtm != null ? '%' : undefined}
            icon={<TrendingUp size={15} />}
            caption={a.bondValue > 0 ? `Облигации: ${formatRub(a.bondValue)}` : 'Облигаций в портфеле нет'}
          />
        </Card>
        <Card>
          <StatCard
            label="Срок до погашения"
            value={a.weightedDaysToMaturity != null ? YEARS1.format(a.weightedDaysToMaturity / 365) : '—'}
            unit={a.weightedDaysToMaturity != null ? 'лет' : undefined}
            icon={<CalendarClock size={15} />}
            caption="Средневзвешенный по стоимости"
          />
        </Card>
        <Card>
          <StatCard
            label="Доходность за 12 мес"
            value={a.trailingYield != null ? PCT2.format(a.trailingYield) : '—'}
            unit={a.trailingYield != null ? '%' : undefined}
            icon={<Banknote size={15} />}
            caption={`Дивиденды + купоны: ${formatRub(a.trailingIncome)}`}
          />
        </Card>
      </div>

      <Card title="Дивиденды и купоны по месяцам" subtitle="Поступления к зачислению за последние 12 месяцев">
        <BarChart data={chartData} />
        <div className="ia-an-legend">
          <span className="ia-an-legend__item">
            <span className="ia-an-legend__swatch" style={{ background: 'var(--azure-500)' }} />Дивиденды
          </span>
          <span className="ia-an-legend__item">
            <span className="ia-an-legend__swatch" style={{ background: 'var(--violet-500)' }} />Купоны
          </span>
        </div>
      </Card>

      <Card title="Топ позиций по весу" tightBody>
        {a.topPositions.length === 0 ? <Empty text="Нет позиций" /> : (
          <table className="ia-table">
            <thead>
              <tr>
                <th>Инструмент</th>
                <th>Тип</th>
                <th>Портфель</th>
                <th className="r">Стоимость</th>
                <th className="r">Доля</th>
                <th className="r">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {a.topPositions.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div className="ia-cell-tk">
                      <div>
                        <div className="ia-cell-tk__t ia-mono">{p.ticker}</div>
                        {p.name && p.name !== p.ticker && <div className="ia-cell-tk__n">{p.name}</div>}
                      </div>
                    </div>
                  </td>
                  <td><Badge tone="neutral" size="sm">{ASSET_TYPE_LABEL[p.assetType]}</Badge></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{p.accountName}</td>
                  <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatRub(p.currentValue)}</td>
                  <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{p.portfolioWeight.toFixed(1)}%</td>
                  <td className="r"><PnLValue value={p.unrealizedPnl} percent={p.unrealizedPnlPercent} display="percent" size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="ia-grid-top">
        <Card title="Лидеры роста">
          {a.topGainers.length === 0 ? <Empty text="Нет позиций с прибылью" /> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {a.topGainers.map((p, i) => (
                <div key={i} className="ia-stat-row">
                  <span className="ia-stat-row__label">
                    <span className="ia-mono" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{p.ticker}</span>
                    <span style={{ color: 'var(--text-3)', marginLeft: 6, fontSize: 'var(--text-xs)' }}>{p.accountName}</span>
                  </span>
                  <PnLValue value={p.unrealizedPnl} percent={p.unrealizedPnlPercent} display="percent" size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Аутсайдеры">
          {a.topLosers.length === 0 ? <Empty text="Нет убыточных позиций" /> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {a.topLosers.map((p, i) => (
                <div key={i} className="ia-stat-row">
                  <span className="ia-stat-row__label">
                    <span className="ia-mono" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{p.ticker}</span>
                    <span style={{ color: 'var(--text-3)', marginLeft: 6, fontSize: 'var(--text-xs)' }}>{p.accountName}</span>
                  </span>
                  <PnLValue value={p.unrealizedPnl} percent={p.unrealizedPnlPercent} display="percent" size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Что пока не учитывается</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-3)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          <li>P&amp;L за период (день / неделя / месяц / квартал / год) — нет исторических снимков портфеля</li>
          <li>Карта по секторам — по эмитентам секторы пока не размечены</li>
          <li>Топ движений рынка вне портфеля — нет источника котировок по всем бумагам биржи</li>
          <li>Сравнение с бенчмарком (IMOEX, RGBI) и альфа портфеля — данные бенчмарка не загружены</li>
          <li>Форвардная дивидендная доходность — нет прогноза выплат на акцию</li>
        </ul>
      </Card>
    </div>
  )
}
