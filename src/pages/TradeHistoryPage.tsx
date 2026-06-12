import { useEffect, useMemo, useState } from 'react'
import { History as HistoryIcon } from 'lucide-react'
import { Card, Badge, Select } from '../components'
import { usePortfolio } from '../hooks/usePortfolio'
import { useTradeHistory } from '../hooks/useTradeHistory'
import { formatPrice } from '../utils/format'
import type { AssetType } from '@/types'

const NUM0 = new Intl.NumberFormat('ru-RU')

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
      <HistoryIcon size={40} strokeWidth={1.2} color="var(--text-4)" />
      <div style={{ fontSize: 'var(--text-base)' }}>{text}</div>
    </div>
  )
}

export function TradeHistoryPage() {
  const { filteredAccounts, isLoading: portfolioLoading } = usePortfolio()
  const { rows, isLoading, error } = useTradeHistory(filteredAccounts)

  const [accountId, setAccountId] = useState('all')
  const [assetType, setAssetType] = useState('all')

  const accountOptions = useMemo(() => [
    { value: 'all', label: 'Все портфели' },
    ...filteredAccounts.map((a) => ({ value: a.id, label: a.name })),
  ], [filteredAccounts])

  const accountOptionsKey = accountOptions.map((o) => o.value).join(',')
  useEffect(() => {
    if (accountId !== 'all' && !accountOptionsKey.split(',').includes(accountId)) {
      setAccountId('all')
    }
  }, [accountOptionsKey, accountId])

  const filtered = rows.filter((r) =>
    (accountId === 'all' || r.accountId === accountId) &&
    (assetType === 'all' || r.assetType === assetType)
  )

  const loading = portfolioLoading || isLoading

  return (
    <div className="ia-screen">
      <Card tightBody>
        <div className="ia-table-head">
          <div className="ia-eyebrow">Все сделки{!loading && ` · ${filtered.length}`}</div>
          <div className="ia-table-head__r">
            <Select
              size="sm"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              options={[
                { value: 'all', label: 'Все типы активов' },
                { value: 'equity', label: 'Акции' },
                { value: 'bond', label: 'Облигации' },
              ]}
            />
            <Select
              size="sm"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              options={accountOptions}
            />
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <Empty text={`Ошибка загрузки: ${error}`} />
        ) : filtered.length === 0 ? (
          <Empty text={rows.length === 0
            ? 'Сделок пока нет — добавьте первую через ИИ-аналитика или форму сделки.'
            : 'Нет сделок по выбранным фильтрам.'} />
        ) : (
          <table className="ia-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Инструмент</th>
                <th>Тип актива</th>
                <th>Операция</th>
                <th className="r">Кол-во</th>
                <th className="r">Цена</th>
                <th className="r">Комиссия</th>
                <th className="r">Сумма</th>
                <th>Портфель</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const total = t.side === 'buy'
                  ? t.quantity * t.price + t.fee
                  : t.quantity * t.price - t.fee
                return (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {new Date(t.executedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div className="ia-cell-tk">
                        <div>
                          <div className="ia-cell-tk__t ia-mono">{t.ticker}</div>
                          {t.name && t.name !== t.ticker && <div className="ia-cell-tk__n">{t.name}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {t.assetType
                        ? <Badge tone="neutral" size="sm">{ASSET_TYPE_LABEL[t.assetType]}</Badge>
                        : <span style={{ color: 'var(--text-4)' }}>—</span>}
                    </td>
                    <td>
                      <Badge tone={t.side === 'buy' ? 'positive' : 'negative'} size="sm">
                        {t.side === 'buy' ? 'Покупка' : 'Продажа'}
                      </Badge>
                    </td>
                    <td className="r ia-num">{NUM0.format(t.quantity)}</td>
                    <td className="r ia-num">{formatPrice(t.price, t.currency)}</td>
                    <td className="r ia-num">{formatPrice(t.fee, t.currency)}</td>
                    <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatPrice(total, t.currency)}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{t.accountName}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
