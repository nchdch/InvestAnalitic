import { useMemo, useState } from 'react'
import { Scale, RotateCcw } from 'lucide-react'
import { Card, Badge, Button, Input } from '../components'
import { usePortfolio } from '../hooks/usePortfolio'
import { useSettingsStore } from '../store/settingsStore'
import { useRebalanceStore } from '../store/rebalanceStore'
import { formatRub } from '../utils/format'
import type { AssetType } from '@/types'

const PCT1 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Ориентировочная комиссия брокера на сделку (0,3%). */
const COMMISSION_RATE = 0.003
/** Ставка НДФЛ для оценки налога с реализованной прибыли при продаже (упрощённо, без сальдирования убытков). */
const TAX_RATE = 0.13

interface RebalanceRow {
  ticker: string
  name?: string
  assetType: AssetType
  currentValue: number
  currentWeight: number
  targetWeight: number
  deviation: number
  unrealizedPnl: number
  action: 'buy' | 'sell' | 'hold'
  amount: number
  commission: number
  estimatedTax: number
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
      <Scale size={40} strokeWidth={1.2} color="var(--text-4)" />
      <div style={{ fontSize: 'var(--text-base)' }}>{text}</div>
    </div>
  )
}

export function RebalancePage() {
  const { filteredAccounts, filteredSummary, isLoading } = usePortfolio()
  const rebalanceThreshold = useSettingsStore((s) => s.rebalanceThreshold)
  const targets = useRebalanceStore((s) => s.targets)
  const setTarget = useRebalanceStore((s) => s.setTarget)
  const resetTargets = useRebalanceStore((s) => s.resetTargets)
  const [additionalFunds, setAdditionalFunds] = useState(0)

  const totalValue = filteredSummary?.totalValue ?? 0

  const rows = useMemo<RebalanceRow[]>(() => {
    if (totalValue <= 0) return []

    const map = new Map<string, { name?: string; assetType: AssetType; currentValue: number; portfolioWeight: number; unrealizedPnl: number }>()
    for (const acc of filteredAccounts) {
      for (const r of acc.equityRows) {
        const tk = r.position.ticker
        const prev = map.get(tk)
        if (prev) {
          prev.currentValue += r.currentValue
          prev.portfolioWeight += r.portfolioWeight
          prev.unrealizedPnl += r.unrealizedPnl
        } else {
          map.set(tk, { name: r.position.name, assetType: 'equity', currentValue: r.currentValue, portfolioWeight: r.portfolioWeight, unrealizedPnl: r.unrealizedPnl })
        }
      }
      for (const r of acc.bondRows) {
        const tk = r.position.ticker
        const prev = map.get(tk)
        if (prev) {
          prev.currentValue += r.currentValue
          prev.portfolioWeight += r.portfolioWeight
          prev.unrealizedPnl += r.unrealizedPnl
        } else {
          map.set(tk, { name: r.position.name, assetType: 'bond', currentValue: r.currentValue, portfolioWeight: r.portfolioWeight, unrealizedPnl: r.unrealizedPnl })
        }
      }
    }

    const prelim = [...map.entries()]
      .sort((a, b) => b[1].currentValue - a[1].currentValue)
      .map(([ticker, v]) => {
        const currentWeight = v.portfolioWeight
        const targetWeight = targets[ticker] ?? Math.round(currentWeight * 10) / 10
        const deviation = currentWeight - targetWeight
        const rawDiff = (totalValue * targetWeight) / 100 - v.currentValue
        return { ticker, ...v, currentWeight, targetWeight, deviation, rawDiff }
      })

    // Покупки распределяем по доп. средствам, если они указаны — без необходимости продавать другие позиции.
    const buyNeeds = prelim.filter((p) => p.deviation < -rebalanceThreshold && p.rawDiff > 0)
    const totalBuyNeed = buyNeeds.reduce((s, p) => s + p.rawDiff, 0)
    const fundsFactor = additionalFunds > 0 && totalBuyNeed > 0 ? Math.min(1, additionalFunds / totalBuyNeed) : 1

    return prelim.map((p) => {
      let action: RebalanceRow['action'] = 'hold'
      let amount = 0
      if (p.deviation > rebalanceThreshold && p.rawDiff < 0) {
        action = 'sell'
        amount = Math.abs(p.rawDiff)
      } else if (p.deviation < -rebalanceThreshold && p.rawDiff > 0) {
        action = 'buy'
        amount = p.rawDiff * fundsFactor
      }
      const commission = amount * COMMISSION_RATE
      const saleFraction = p.currentValue > 0 ? amount / p.currentValue : 0
      const estimatedTax = action === 'sell' && p.unrealizedPnl > 0 ? p.unrealizedPnl * saleFraction * TAX_RATE : 0

      return {
        ticker: p.ticker, name: p.name, assetType: p.assetType,
        currentValue: p.currentValue, currentWeight: p.currentWeight, targetWeight: p.targetWeight,
        deviation: p.deviation, unrealizedPnl: p.unrealizedPnl,
        action, amount, commission, estimatedTax,
      }
    })
  }, [filteredAccounts, totalValue, targets, rebalanceThreshold, additionalFunds])

  const actionRows = rows.filter((r) => r.action !== 'hold')
  const totalBuy = rows.filter((r) => r.action === 'buy').reduce((s, r) => s + r.amount, 0)
  const totalSell = rows.filter((r) => r.action === 'sell').reduce((s, r) => s + r.amount, 0)
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0)
  const totalTax = rows.reduce((s, r) => s + r.estimatedTax, 0)
  const targetSum = rows.reduce((s, r) => s + r.targetWeight, 0)

  const loading = isLoading

  return (
    <div className="ia-screen ia-grid-reb">
      <Card
        title="Целевые веса"
        subtitle="Задай % — аналитик рассчитает сделки"
        actions={
          Object.keys(targets).length > 0
            ? <Button size="sm" variant="ghost" leftIcon={<RotateCcw size={14} />} onClick={resetTargets}>Сбросить</Button>
            : undefined
        }
      >
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty text="В портфеле пока нет позиций для ребалансировки." />
        ) : (
          <>
            {rows.map((r) => (
              <div key={r.ticker} className="ia-reb-row">
                <span className="ia-mono ia-reb-row__tk">{r.ticker}</span>
                <div className="ia-reb-bar">
                  <div className="ia-reb-bar__cur" style={{ width: Math.min(100, Math.max(0, r.currentWeight)) + '%' }} />
                  <div className="ia-reb-bar__tgt" style={{ left: Math.min(100, Math.max(0, r.targetWeight)) + '%' }} />
                </div>
                <span className="ia-num ia-reb-row__cur">{PCT1.format(r.currentWeight)}%</span>
                <span style={{ color: 'var(--text-3)', fontSize: 12 }}>→</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="100"
                  value={r.targetWeight}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setTarget(r.ticker, Number.isFinite(v) ? v : 0)
                  }}
                  aria-label={`Целевой вес ${r.ticker}`}
                  style={{
                    width: 52, textAlign: 'right', background: 'var(--surface-card)',
                    border: '1px solid var(--border-2)', borderRadius: 6,
                    padding: '3px 6px', fontSize: 12, fontWeight: 600,
                    color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ color: 'var(--text-3)', fontSize: 12 }}>%</span>
              </div>
            ))}
            <div className="ia-reb-legend">
              <span><i className="dot cur" />Текущий</span>
              <span><i className="dot tgt" />Цель</span>
              <span style={{ marginLeft: 'auto' }}>Сумма целей: {PCT1.format(targetSum)}%</span>
            </div>
          </>
        )}
      </Card>

      <Card title="План сделок" subtitle={`Порог отклонения: ±${PCT1.format(rebalanceThreshold)}%`}>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty text="Нет данных для расчёта плана." />
        ) : (
          <>
            <Input
              label="Доп. средства для покупок"
              numeric
              size="sm"
              suffix="₽"
              value={additionalFunds || ''}
              placeholder="0"
              onChange={(e) => {
                const v = Number(e.target.value)
                setAdditionalFunds(Number.isFinite(v) && v >= 0 ? v : 0)
              }}
              hint="Если позиция недовешена, новые средства направляются на её покупку без продажи других активов."
            />

            {actionRows.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
                Все позиции в пределах порога отклонения — действия не требуются.
              </div>
            ) : (
              <table className="ia-table ia-table--plain">
                <thead>
                  <tr>
                    <th>Тикер</th>
                    <th>Действие</th>
                    <th className="r">Сумма</th>
                    <th className="r">Комиссия</th>
                    <th className="r">Налог</th>
                  </tr>
                </thead>
                <tbody>
                  {actionRows.map((r) => (
                    <tr key={r.ticker}>
                      <td className="ia-mono">{r.ticker}</td>
                      <td>
                        <Badge tone={r.action === 'buy' ? 'positive' : 'negative'} size="sm">
                          {r.action === 'buy' ? 'Купить' : 'Продать'}
                        </Badge>
                      </td>
                      <td className="r ia-num" style={{ color: r.action === 'buy' ? 'var(--pnl-up)' : 'var(--pnl-down)' }}>
                        {r.action === 'buy' ? '+' : '−'}{formatRub(r.amount)}
                      </td>
                      <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{formatRub(r.commission)}</td>
                      <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{r.estimatedTax > 0 ? formatRub(r.estimatedTax) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {actionRows.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginTop: 12 }}>
                <span>Купить: <b style={{ color: 'var(--pnl-up)' }}>{formatRub(totalBuy)}</b></span>
                <span>Продать: <b style={{ color: 'var(--pnl-down)' }}>{formatRub(totalSell)}</b></span>
                <span>Комиссии: <b>{formatRub(totalCommission)}</b></span>
                <span>Налог с продаж: <b>{formatRub(totalTax)}</b></span>
                {additionalFunds > totalBuy && (
                  <span>Остаток средств: <b>{formatRub(additionalFunds - totalBuy)}</b></span>
                )}
              </div>
            )}

            <div className="ia-note">
              <span style={{ color: 'var(--text-3)', fontSize: 14 }}>ℹ</span>
              <span>
                Не индивидуальная инвестиционная рекомендация. Комиссии оценены по ставке {PCT1.format(COMMISSION_RATE * 100)}%,
                налог с продаж — по ставке {PCT1.format(TAX_RATE * 100)}% от прибыли пропорционально продаваемой доле позиции,
                без учёта сальдирования с убытками по другим бумагам.
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
