import { useEffect, useMemo, useState } from 'react'
import { Layers, TrendingUp, CalendarClock, Banknote, PieChart, Wallet, Activity, Percent, Target, Coins } from 'lucide-react'
import { Card, StatCard, Badge, PnLValue, BarChart, DonutChart, Select, Input } from '../components'
import { usePortfolio } from '../hooks/usePortfolio'
import { useAnalytics, ANALYTICS_FILTERS_DEFAULT } from '../hooks/useAnalytics'
import type { AnalyticsFilters, PortfolioPositionRow } from '../hooks/useAnalytics'
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
  const { filteredSummary, filteredAccounts, isLoading: portfolioLoading } = usePortfolio()
  const [filters, setFilters] = useState<AnalyticsFilters>(ANALYTICS_FILTERS_DEFAULT)
  const a = useAnalytics(filteredAccounts, filters)
  const loading = portfolioLoading || a.isLoading

  // Сценарный анализ «что если»
  const [rateDeltaInput, setRateDeltaInput] = useState('-2')
  const [fxDeltaInput, setFxDeltaInput] = useState('20')
  const [shockKey, setShockKey] = useState<string | null>(null)
  const [shockPctInput, setShockPctInput] = useState('-15')

  const accountOptions = useMemo(() => [
    { value: 'all', label: 'Все портфели' },
    ...filteredAccounts.map((acc) => ({ value: acc.id, label: acc.name })),
  ], [filteredAccounts])

  const accountOptionsKey = accountOptions.map((o) => o.value).join(',')
  useEffect(() => {
    if (filters.accountId !== 'all' && !accountOptionsKey.split(',').includes(filters.accountId)) {
      setFilters((f) => ({ ...f, accountId: 'all' }))
    }
  }, [accountOptionsKey, filters.accountId])

  const accountsForTickers = filters.accountId === 'all'
    ? filteredAccounts
    : filteredAccounts.filter((acc) => acc.id === filters.accountId)

  const tickerOptions = useMemo(() => {
    const set = new Set<string>()
    for (const acc of accountsForTickers) {
      if (filters.assetType !== 'bond') for (const r of acc.equityRows) set.add(r.position.ticker)
      if (filters.assetType !== 'equity') for (const r of acc.bondRows) set.add(r.position.ticker)
    }
    return [{ value: 'all', label: 'Все бумаги' }, ...Array.from(set).sort().map((t) => ({ value: t, label: t }))]
  }, [accountsForTickers, filters.assetType])

  const tickerOptionsKey = tickerOptions.map((o) => o.value).join(',')
  useEffect(() => {
    if (filters.ticker !== 'all' && !tickerOptionsKey.split(',').includes(filters.ticker)) {
      setFilters((f) => ({ ...f, ticker: 'all' }))
    }
  }, [tickerOptionsKey, filters.ticker])

  const globalPositionsCount = filteredAccounts.reduce((s, acc) => s + acc.equityRows.length + acc.bondRows.length, 0)

  if (loading) return <div className="ia-screen"><Spinner /></div>
  if (!filteredSummary || globalPositionsCount === 0) {
    return <div className="ia-screen"><Empty text="Недостаточно данных для аналитики — добавьте позиции в портфель, чтобы увидеть метрики качества." /></div>
  }

  const filtersActive = filters.accountId !== 'all' || filters.assetType !== 'all' || filters.ticker !== 'all'
  const selectedAccount = filters.accountId === 'all' ? null : filteredAccounts.find((acc) => acc.id === filters.accountId) ?? null

  const baseTotalValue = selectedAccount ? selectedAccount.totalValue : filteredSummary.totalValue
  const baseDayChange = selectedAccount ? selectedAccount.dayChange : filteredSummary.dayChange
  const baseUnrealizedPnl = selectedAccount ? selectedAccount.unrealizedPnl : filteredSummary.unrealizedPnl
  const baseUnrealizedPnlPercent = selectedAccount ? selectedAccount.unrealizedPnlPercent : filteredSummary.unrealizedPnlPercent

  const prevValue = baseTotalValue - baseDayChange
  const dayChangePercent = prevValue !== 0 ? (baseDayChange / prevValue) * 100 : null

  const chartData = a.monthlyIncome.map((m) => ({
    label: m.label,
    segments: [
      { value: m.dividends, color: 'var(--azure-500)' },
      { value: m.coupons, color: 'var(--violet-500)' },
    ],
  }))

  const currencyChartData = a.currencyExposure.map((c) => ({ label: c.currency, value: c.value, weight: c.weight, color: c.color }))

  // Сценарий 1: изменение ключевой ставки → переоценка облигаций по дюрации (ΔP/P ≈ -D × Δy)
  const rateDelta = Number(rateDeltaInput) || 0
  const bondPriceChangePercent = a.bondDurationYears != null ? -a.bondDurationYears * rateDelta : null
  const bondValueChange = bondPriceChangePercent != null ? a.bondValue * (bondPriceChangePercent / 100) : null
  const totalAfterRate = a.totalValue + (bondValueChange ?? 0)

  // Сценарий 2: ослабление/укрепление рубля → переоценка валютных позиций и остатков
  const fxDelta = Number(fxDeltaInput) || 0
  const fxValueChange = a.foreignCurrencyValue * (fxDelta / 100)
  const totalAfterFx = a.totalValue + fxValueChange

  // Сценарий 3: шок цены отдельной бумаги
  const positionKey = (p: PortfolioPositionRow) => `${p.ticker}__${p.accountName}`
  const fallbackShockKey = a.positions[0] ? positionKey(a.positions[0]) : ''
  const shockPosition = a.positions.find((p) => positionKey(p) === (shockKey ?? fallbackShockKey)) ?? a.positions[0] ?? null
  const effectiveShockKey = shockPosition ? positionKey(shockPosition) : fallbackShockKey
  const shockPct = Number(shockPctInput) || 0
  const shockValueChange = shockPosition ? shockPosition.currentValue * (shockPct / 100) : 0
  const totalAfterShock = a.totalValue + shockValueChange
  const shockWeightBefore = shockPosition && a.totalValue > 0 ? (shockPosition.currentValue / a.totalValue) * 100 : null
  const shockWeightAfter = shockPosition && totalAfterShock > 0 ? ((shockPosition.currentValue + shockValueChange) / totalAfterShock) * 100 : null

  return (
    <div className="ia-screen">
      <Card tightBody>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px 20px' }}>
          <div>
            <div className="ia-eyebrow">Фильтры аналитики</div>
            {filtersActive && (
              <div style={{ marginTop: 4, color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
                В выборке: {a.positionsCount} поз. на {formatRub(a.positionsValue)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Select
              size="sm"
              value={filters.accountId}
              onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}
              options={accountOptions}
            />
            <Select
              size="sm"
              value={filters.assetType}
              onChange={(e) => setFilters((f) => ({ ...f, assetType: e.target.value as AnalyticsFilters['assetType'] }))}
              options={[
                { value: 'all', label: 'Все типы' },
                { value: 'equity', label: 'Акции' },
                { value: 'bond', label: 'Облигации' },
              ]}
            />
            <Select
              size="sm"
              value={filters.ticker}
              onChange={(e) => setFilters((f) => ({ ...f, ticker: e.target.value }))}
              options={tickerOptions}
            />
          </div>
        </div>
      </Card>

      <div className="ia-an-top">
        <Card title="Состав портфеля по бумагам" subtitle="Доля от текущей стоимости позиций">
          <DonutChart data={a.composition} />
        </Card>
        <Card title={selectedAccount ? `Портфель «${selectedAccount.name}»` : 'Портфель'}>
          <div className="ia-an-quickstats">
            <StatCard
              label="Стоимость портфеля"
              value={formatRub(baseTotalValue)}
              icon={<Wallet size={15} />}
            />
            <StatCard
              label="Изменение за день"
              value={<PnLValue value={baseDayChange} percent={dayChangePercent} display="both" size="lg" />}
              icon={<Activity size={15} />}
            />
            <StatCard
              label="Доходность портфеля"
              value={<PnLValue value={baseUnrealizedPnl} percent={baseUnrealizedPnlPercent} display="percent" size="lg" />}
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
        <Card>
          <StatCard
            label="Форвардная доходность облигаций"
            value={a.forwardBondYield != null ? PCT2.format(a.forwardBondYield) : '—'}
            unit={a.forwardBondYield != null ? '%' : undefined}
            icon={<Coins size={15} />}
            caption={a.forwardBondCoupon > 0 ? `Купонами в год: ${formatRub(a.forwardBondCoupon)}` : 'Облигаций в портфеле нет'}
          />
        </Card>
      </div>

      <div className="ia-grid-top">
        <Card title="Валютная структура портфеля" subtitle="Позиции и денежные остатки в рублёвом эквиваленте">
          {currencyChartData.length === 0 ? <Empty text="Нет данных для расчёта" /> : (
            <>
              <DonutChart data={currencyChartData} />
              {a.foreignCurrencyValue > 0 && (
                <div style={{ marginTop: 14, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
                  В иностранной валюте: <strong style={{ color: 'var(--text-1)' }}>{formatRub(a.foreignCurrencyValue)}</strong>
                  {' '}({a.totalValue > 0 ? PCT2.format((a.foreignCurrencyValue / a.totalValue) * 100) : '0,00'}% портфеля)
                </div>
              )}
            </>
          )}
        </Card>

        <Card title="Сценарии: ставка и курс" subtitle="Гипотетическая переоценка портфеля">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <Input
                label="Изменение ключевой ставки"
                type="number"
                step="0.5"
                value={rateDeltaInput}
                onChange={(e) => setRateDeltaInput(e.target.value)}
                suffix="п.п."
              />
              {a.bondDurationYears != null ? (
                <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
                  Облигации (дюрация ≈ {YEARS1.format(a.bondDurationYears)} г.):{' '}
                  <PnLValue value={bondValueChange ?? 0} percent={bondPriceChangePercent} display="both" size="sm" />
                  {' '}→ портфель {formatRub(totalAfterRate)}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>Облигаций в портфеле нет</div>
              )}
            </div>

            <div>
              <Input
                label="Изменение курса ₽ к иностранным валютам"
                type="number"
                step="1"
                value={fxDeltaInput}
                onChange={(e) => setFxDeltaInput(e.target.value)}
                suffix="%"
                hint="Положительное значение — рубль слабеет"
              />
              {a.foreignCurrencyValue > 0 ? (
                <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
                  Валютная позиция {formatRub(a.foreignCurrencyValue)}:{' '}
                  <PnLValue value={fxValueChange} percent={a.totalValue > 0 ? (fxValueChange / a.totalValue) * 100 : null} display="both" size="sm" />
                  {' '}→ портфель {formatRub(totalAfterFx)}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>Весь портфель в рублях</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Сценарий: изменение цены бумаги" subtitle="Влияние на P&L позиции и её вес в портфеле">
        {a.positions.length === 0 ? <Empty text="Нет позиций для расчёта" /> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 480 }}>
              <Select
                label="Бумага"
                value={effectiveShockKey}
                onChange={(e) => setShockKey(e.target.value)}
                options={a.positions.map((p) => ({ value: positionKey(p), label: `${p.ticker} · ${p.accountName}` }))}
              />
              <Input
                label="Изменение цены"
                type="number"
                step="1"
                value={shockPctInput}
                onChange={(e) => setShockPctInput(e.target.value)}
                suffix="%"
              />
            </div>
            {shockPosition && (
              <div style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
                {shockPosition.ticker}: {formatRub(shockPosition.currentValue)} → {formatRub(shockPosition.currentValue + shockValueChange)}
                {' '}(<PnLValue value={shockValueChange} percent={shockPct} display="both" size="sm" />)
                <br />
                Доля в портфеле: {shockWeightBefore != null ? PCT2.format(shockWeightBefore) : '—'}%
                {' '}→ {shockWeightAfter != null ? PCT2.format(shockWeightAfter) : '—'}%
                <br />
                Портфель целиком: {formatRub(a.totalValue)} → {formatRub(totalAfterShock)}
              </div>
            )}
          </>
        )}
      </Card>

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
        {a.topPositions.length === 0 ? <Empty text={filtersActive ? 'Нет позиций по выбранным фильтрам' : 'Нет позиций'} /> : (
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
