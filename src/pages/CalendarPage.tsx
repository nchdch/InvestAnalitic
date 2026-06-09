
import { Card, StatCard, Badge, Avatar } from '../components'
import { Calendar, Banknote, TrendingUp } from 'lucide-react'

const PAYMENTS = [
  { date: '12.06.2026', ticker: 'SBER',     name: 'Сбербанк',         type: 'dividend', perShare: '12,50 ₽', amount: '6 250 ₽',   status: 'upcoming', days: 4 },
  { date: '15.06.2026', ticker: 'OFZ26238', name: 'ОФЗ 26238',        type: 'coupon',   perShare: '35,15 ₽', amount: '10 545 ₽',  status: 'upcoming', days: 7 },
  { date: '20.06.2026', ticker: 'LKOH',     name: 'Лукойл',           type: 'dividend', perShare: '514 ₽',   amount: '51 400 ₽',  status: 'upcoming', days: 12 },
  { date: '01.06.2026', ticker: 'SBER',     name: 'Сбербанк',         type: 'dividend', perShare: '12,50 ₽', amount: '6 250 ₽',   status: 'paid',     days: 0 },
  { date: '01.06.2026', ticker: 'OFZ26238', name: 'ОФЗ 26238',        type: 'coupon',   perShare: '35,15 ₽', amount: '10 545 ₽',  status: 'paid',     days: 0 },
] as const

export function CalendarPage() {
  return (
    <div className="ia-screen">
      <div className="ia-cal-stats">
        <Card>
          <StatCard label="Ожидается за 30 дней" value="67 270 ₽" icon={<Calendar size={15} />} />
        </Card>
        <Card>
          <StatCard label="Получено в этом году" value="184 320 ₽" icon={<Banknote size={15} />} />
        </Card>
        <Card>
          <StatCard label="Форвардная доходность" value="8,4" unit="%" icon={<TrendingUp size={15} />} />
        </Card>
      </div>

      <Card title="Ближайшие выплаты" tightBody>
        <table className="ia-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Инструмент</th>
              <th>Тип</th>
              <th className="r">На бумагу</th>
              <th className="r">Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {PAYMENTS.map((p, i) => (
              <tr key={i}>
                <td className="ia-num" style={{ color: 'var(--text-2)', fontWeight: 600 }}>{p.date}</td>
                <td>
                  <div className="ia-cell-tk">
                    <Avatar
                      name={p.ticker}
                      size="sm"
                      color={p.type === 'coupon' ? 'var(--ink-600)' : undefined}
                    />
                    <div>
                      <div className="ia-cell-tk__t ia-mono">{p.ticker}</div>
                      <div className="ia-cell-tk__n">{p.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge tone={p.type === 'dividend' ? 'accent' : 'neutral'} size="sm">
                    {p.type === 'dividend' ? '💰 Дивиденд' : '🧾 Купон'}
                  </Badge>
                </td>
                <td className="r ia-num">{p.perShare}</td>
                <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{p.amount}</td>
                <td>
                  {p.status === 'paid'
                    ? <Badge tone="positive" dot size="sm">Выплачено</Badge>
                    : <Badge tone="warning" size="sm">Через {p.days} дн.</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
