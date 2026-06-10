import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Card, Avatar, Badge, PnLValue, Tabs, PriceChart } from '../components'
import { useAssetDetail } from '../hooks/useAssetDetail'
import { getTickerLogoUrl } from '../utils/logos'
import { formatRub, formatPercent, formatPrice } from '../utils/format'
import type { AccountSummary } from '@/types'

const NUM0 = new Intl.NumberFormat('ru-RU')

const RANGES = [
  { label: '10 дн', days: 10 },
  { label: '1 мес', days: 30 },
  { label: '3 мес', days: 90 },
  { label: '6 мес', days: 180 },
  { label: 'Год', days: 365 },
]

interface Props {
  ticker: string
  accounts: AccountSummary[]
  onBack: () => void
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ia-stat-row">
      <span className="ia-stat-row__label">{label}</span>
      <span className="ia-stat-row__value">{value}</span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>{text}</div>
}

export function AssetDetailPage({ ticker, accounts, onBack }: Props) {
  const [tab, setTab] = useState('main')
  const [rangeDays, setRangeDays] = useState(365)
  const data = useAssetDetail(ticker, accounts)
  const { position } = data

  const visiblePrices = data.priceHistory.prices.slice(-rangeDays)
  const visibleDates = data.priceHistory.dates.slice(-rangeDays)

  return (
    <div className="ia-screen">
      <button className="ia-back" onClick={onBack}>
        <ArrowLeft size={15} /> К портфелю
      </button>

      <Card>
        {!position ? (
          <Empty text={`Позиция ${ticker} не найдена в текущем портфеле`} />
        ) : (
          <div className="ia-asset-head">
            <Avatar name={ticker} src={getTickerLogoUrl(ticker, 'equity')} size="lg" />
            <div className="ia-asset-head__main">
              <div className="ia-asset-head__title">
                <span className="ia-mono">{ticker}</span>
                {position.name && position.name !== ticker && <span className="ia-asset-head__name"> · {position.name}</span>}
              </div>
              {position.isin && <div className="ia-asset-head__isin">{position.isin}</div>}
            </div>
            <div className="ia-asset-head__price">
              <div className="ia-asset-head__pricenum ia-num">{formatPrice(data.currentPrice, position.currency)}</div>
              {data.dayChangePercent != null && (
                <PnLValue percent={data.dayChangePercent} display="percent" size="sm" />
              )}
            </div>
            <Badge tone="neutral">{position.exchange}</Badge>
          </div>
        )}
      </Card>

      {position && (
        <Card tightBody>
          <div className="ia-table-head">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'main', label: 'Главное' },
                { value: 'trades', label: 'Сделки', count: data.trades.length },
                { value: 'dividends', label: 'Дивиденды', count: data.payments.length },
              ]}
            />
          </div>

          {tab === 'main' && (
            <div className="ia-asset-main">
              <div className="ia-asset-stats">
                <div className="ia-eyebrow">История</div>
                <Stat
                  label="Дата первой сделки"
                  value={data.firstTradeDate ? new Date(data.firstTradeDate).toLocaleDateString('ru-RU') : '—'}
                />
                <Stat label="Всего акций" value={NUM0.format(data.totalQuantity)} />
                <Stat label="Стоимость покупок" value={formatPrice(data.totalBought, position.currency)} />
                <Stat label="Стоимость продаж" value={formatPrice(data.totalSold, position.currency)} />

                <div className="ia-eyebrow" style={{ marginTop: 18 }}>Цена и P&amp;L</div>
                <Stat label="Средняя цена" value={formatPrice(data.averagePrice, position.currency)} />
                <Stat label="Текущая цена" value={formatPrice(data.currentPrice, position.currency)} />
                <Stat label="Стоимость позиции" value={formatRub(data.currentValue)} />
                <Stat
                  label="Прибыль/убыток"
                  value={<PnLValue value={data.unrealizedPnl} percent={data.unrealizedPnlPercent} display="both" size="sm" />}
                />
                <Stat
                  label="Изм. за день"
                  value={data.dayChange != null
                    ? <PnLValue value={data.dayChange} percent={data.dayChangePercent ?? undefined} display="both" size="sm" />
                    : <span style={{ color: 'var(--text-4)' }}>—</span>}
                />
              </div>

              <div className="ia-asset-chart">
                <div className="ia-asset-chart__ranges">
                  {RANGES.map((r) => (
                    <button
                      key={r.days}
                      className={'ia-rangebtn' + (rangeDays === r.days ? ' is-active' : '')}
                      onClick={() => setRangeDays(r.days)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {data.isLoading
                  ? <Empty text="Загрузка истории цен…" />
                  : <PriceChart dates={visibleDates} prices={visiblePrices} />}
                {data.performance.length > 0 && (
                  <div className="ia-asset-perf">
                    {data.performance.map((p) => (
                      <div
                        key={p.label}
                        className={'ia-perfchip' + (p.percent == null ? '' : p.percent >= 0 ? ' is-up' : ' is-down')}
                      >
                        <span className="ia-perfchip__pct">{p.percent != null ? formatPercent(p.percent) : '—'}</span>
                        <span className="ia-perfchip__label">{p.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {data.rows.length > 0 && (
                <div className="ia-asset-accounts">
                  <div className="ia-eyebrow" style={{ marginBottom: 8 }}>Актив во всех портфелях</div>
                  <table className="ia-table">
                    <thead>
                      <tr>
                        <th>Портфель</th>
                        <th className="r">Кол-во</th>
                        <th className="r">Ср. цена</th>
                        <th className="r">Стоимость</th>
                        <th className="r">Прибыль</th>
                        <th className="r">Доля</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => (
                        <tr key={r.accountId}>
                          <td>{r.accountName}</td>
                          <td className="r ia-num">{NUM0.format(r.position.quantity)}</td>
                          <td className="r ia-num">{formatPrice(r.position.averagePrice, r.position.currency)}</td>
                          <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatRub(r.currentValue)}</td>
                          <td className="r"><PnLValue value={r.unrealizedPnl} percent={r.unrealizedPnlPercent} display="both" size="sm" /></td>
                          <td className="r ia-num" style={{ color: 'var(--text-3)' }}>{r.portfolioWeight.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'trades' && (
            data.trades.length === 0
              ? <Empty text="Сделок по этой бумаге не найдено" />
              : <table className="ia-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Тип</th>
                      <th className="r">Кол-во</th>
                      <th className="r">Цена</th>
                      <th className="r">Комиссия</th>
                      <th>Портфель</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trades.map((t) => (
                      <tr key={t.id}>
                        <td>{new Date(t.executedAt).toLocaleString('ru-RU')}</td>
                        <td><Badge tone={t.side === 'buy' ? 'positive' : 'negative'} size="sm">{t.side === 'buy' ? 'Покупка' : 'Продажа'}</Badge></td>
                        <td className="r ia-num">{NUM0.format(t.quantity)}</td>
                        <td className="r ia-num">{formatPrice(t.price, t.currency)}</td>
                        <td className="r ia-num">{formatPrice(t.fee, t.currency)}</td>
                        <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{t.accountName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          )}

          {tab === 'dividends' && (
            data.payments.length === 0
              ? <Empty text="Выплат по этой бумаге не найдено" />
              : <table className="ia-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Тип</th>
                      <th className="r">До налога</th>
                      <th className="r">Налог</th>
                      <th className="r">К получению</th>
                      <th>Портфель</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.paymentDate).toLocaleDateString('ru-RU')}</td>
                        <td>{p.type === 'dividend' ? 'Дивиденд' : 'Купон'}</td>
                        <td className="r ia-num">{formatPrice(p.grossAmount, p.currency)}</td>
                        <td className="r ia-num">{formatPrice(p.taxWithheld, p.currency)}</td>
                        <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatPrice(p.netAmount, p.currency)}</td>
                        <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{p.accountName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          )}
        </Card>
      )}
    </div>
  )
}
