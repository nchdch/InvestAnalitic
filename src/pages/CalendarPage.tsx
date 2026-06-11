import { Card, StatCard, Badge, Avatar } from '../components'
import type { BadgeTone } from '../components'
import { Calendar, Banknote, TrendingUp, CalendarClock } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { useCalendar } from '../hooks/useCalendar'
import type { UpcomingPaymentType } from '../hooks/useCalendar'
import { formatRub, formatPrice } from '../utils/format'

const PCT2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TYPE_LABEL: Record<UpcomingPaymentType, string> = {
  coupon: '🧾 Купон',
  amortization: '📉 Амортизация',
  redemption: '🏁 Погашение',
}

const TYPE_TONE: Record<UpcomingPaymentType, BadgeTone> = {
  coupon: 'neutral',
  amortization: 'accent',
  redemption: 'warning',
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
      <CalendarClock size={40} strokeWidth={1.2} color="var(--text-4)" />
      <div style={{ fontSize: 'var(--text-base)' }}>{text}</div>
    </div>
  )
}

export function CalendarPage() {
  const { accounts, isLoading: portfolioLoading } = usePortfolio()
  const cal = useCalendar(accounts)
  const loading = portfolioLoading || cal.isLoading

  if (loading) return <div className="ia-screen"><Spinner /></div>

  return (
    <div className="ia-screen">
      <div className="ia-cal-stats">
        <Card>
          <StatCard label="Ожидается за 30 дней" value={formatRub(cal.upcoming30dTotal)} icon={<Calendar size={15} />} />
        </Card>
        <Card>
          <StatCard label="Получено в этом году" value={formatRub(cal.receivedThisYearTotal)} icon={<Banknote size={15} />} />
        </Card>
        <Card>
          <StatCard
            label="Форвардная доходность"
            value={cal.forwardYield != null ? PCT2.format(cal.forwardYield) : '—'}
            unit={cal.forwardYield != null ? '%' : undefined}
            icon={<TrendingUp size={15} />}
            caption="Купоны облигаций по тек. цене + дивиденды за 12 мес."
          />
        </Card>
      </div>

      <Card title="Ближайшие выплаты" subtitle="Купоны, амортизация и погашение облигаций по справочным данным MOEX" tightBody>
        {cal.upcoming.length === 0 ? (
          <Empty text="Нет облигаций с известной датой ближайшей выплаты — данные обновятся после синхронизации с MOEX" />
        ) : (
          <table className="ia-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Инструмент</th>
                <th>Счёт</th>
                <th>Тип</th>
                <th className="r">На бумагу</th>
                <th className="r">Сумма</th>
                <th>Когда</th>
              </tr>
            </thead>
            <tbody>
              {cal.upcoming.map((p) => (
                <tr key={p.id}>
                  <td className="ia-num" style={{ color: 'var(--text-2)', fontWeight: 600 }}>
                    {new Date(p.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div className="ia-cell-tk">
                      <Avatar name={p.ticker} size="sm" color="var(--ink-600)" />
                      <div>
                        <div className="ia-cell-tk__t ia-mono">{p.ticker}</div>
                        {p.name && <div className="ia-cell-tk__n">{p.name}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{p.accountName}</td>
                  <td><Badge tone={TYPE_TONE[p.type]} size="sm">{TYPE_LABEL[p.type]}</Badge></td>
                  <td className="r ia-num">{p.perUnit != null ? formatPrice(p.perUnit, p.currency) : '—'}</td>
                  <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatPrice(p.amount, p.currency)}</td>
                  <td>
                    <Badge tone="warning" size="sm">{p.daysUntil === 0 ? 'Сегодня' : `Через ${p.daysUntil} дн.`}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="История выплат" subtitle="Полученные дивиденды и купоны" tightBody>
        {cal.history.length === 0 ? (
          <Empty text="История выплат пуста — фиксируйте полученные дивиденды и купоны через ассистента" />
        ) : (
          <table className="ia-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Инструмент</th>
                <th>Счёт</th>
                <th>Тип</th>
                <th className="r">До налога</th>
                <th className="r">Налог</th>
                <th className="r">К получению</th>
              </tr>
            </thead>
            <tbody>
              {cal.history.map((p) => (
                <tr key={p.id}>
                  <td className="ia-num" style={{ color: 'var(--text-2)', fontWeight: 600 }}>
                    {new Date(p.paymentDate).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div className="ia-cell-tk">
                      <Avatar name={p.ticker} size="sm" color={p.type === 'coupon' ? 'var(--ink-600)' : undefined} />
                      <div className="ia-cell-tk__t ia-mono">{p.ticker}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{p.accountName}</td>
                  <td>
                    <Badge tone={p.type === 'dividend' ? 'accent' : 'neutral'} size="sm">
                      {p.type === 'dividend' ? '💰 Дивиденд' : '🧾 Купон'}
                    </Badge>
                  </td>
                  <td className="r ia-num">{formatPrice(p.grossAmount, p.currency)}</td>
                  <td className="r ia-num" style={{ color: 'var(--negative)' }}>{formatPrice(p.taxWithheld, p.currency)}</td>
                  <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatPrice(p.netAmount, p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
