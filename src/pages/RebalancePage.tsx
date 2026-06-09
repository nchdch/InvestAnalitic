
import { Card, Badge, Button } from '../components'

const RUB = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const ROWS = [
  { tk: 'LKOH', cur: 28.9, tgt: 12, action: 'Продать', amount: '−418 600 ₽' },
  { tk: 'YDEX', cur: 10.9, tgt: 12, action: 'Купить', amount: '+27 200 ₽' },
  { tk: 'SBER', cur: 9.2,  tgt: 15, action: 'Купить', amount: '+143 900 ₽' },
  { tk: 'GAZP', cur: 3.9,  tgt: 8,  action: 'Купить', amount: '+101 700 ₽' },
]

export function RebalancePage() {
  return (
    <div className="ia-screen ia-grid-reb">
      <Card title="Целевые веса" subtitle="Задай % — аналитик рассчитает сделки">
        {ROWS.map((r) => (
          <div key={r.tk} className="ia-reb-row">
            <span className="ia-mono ia-reb-row__tk">{r.tk}</span>
            <div className="ia-reb-bar">
              <div className="ia-reb-bar__cur" style={{ width: r.cur + '%' }} />
              <div className="ia-reb-bar__tgt" style={{ left: r.tgt + '%' }} />
            </div>
            <span className="ia-num ia-reb-row__cur">{RUB.format(r.cur)}%</span>
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>→</span>
            <span className="ia-num ia-reb-row__tgt">{r.tgt}%</span>
          </div>
        ))}
        <div className="ia-reb-legend">
          <span><i className="dot cur" />Текущий</span>
          <span><i className="dot tgt" />Цель</span>
        </div>
      </Card>

      <Card title="План сделок" actions={<Button size="sm">Применить</Button>}>
        <table className="ia-table ia-table--plain">
          <thead>
            <tr><th>Тикер</th><th>Действие</th><th className="r">Сумма</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.tk}>
                <td className="ia-mono">{r.tk}</td>
                <td>
                  <Badge tone={r.action === 'Купить' ? 'positive' : 'negative'} size="sm">
                    {r.action}
                  </Badge>
                </td>
                <td
                  className="r ia-num"
                  style={{ color: r.action === 'Купить' ? 'var(--pnl-up)' : 'var(--pnl-down)' }}
                >
                  {r.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ia-note">
          <span style={{ color: 'var(--text-3)', fontSize: 14 }}>ℹ</span>
          <span>Не индивидуальная инвестиционная рекомендация. Комиссии и налоги ориентировочные.</span>
        </div>
      </Card>
    </div>
  )
}
