import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Pencil } from 'lucide-react'
import { Button, Badge } from '../index'
import { TradeModal } from './TradeModal'
import { injectOnce } from '../_internal/style'
import { getTrades, deleteTrade } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'
import { formatPrice } from '../../utils/format'
import type { Trade } from '@/types'

const NUM0 = new Intl.NumberFormat('ru-RU')

interface Props {
  open: boolean
  onClose: () => void
  accountId: string
  ticker: string
  name?: string
}

export function TradesListModal({ open, onClose, accountId, ticker, name }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getTrades(accountId, ticker)
      .then((list) => setTrades([...list].sort((a, b) => b.executedAt.localeCompare(a.executedAt))))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [accountId, ticker])

  useEffect(() => {
    if (!open) return
    load()
  }, [open, load])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить сделку? Позиция будет пересчитана.')) return
    setDeletingId(id)
    setError('')
    try {
      await deleteTrade(id)
      setTrades((list) => list.filter((t) => t.id !== id))
      bump()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (!open) return null

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal ia-modal--wide" role="dialog" aria-modal="true" aria-label="Все сделки">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Сделки {ticker}{name ? ` · ${name}` : ''}</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <div className="ia-modal__body">
          {error && <div className="ia-modal-error">{error}</div>}

          {loading ? (
            <div className="ia-notes-loading">Загрузка…</div>
          ) : trades.length === 0 ? (
            <div className="ia-notes-empty">Сделок по этой бумаге не найдено</div>
          ) : (
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th className="r">Кол-во</th>
                  <th className="r">Цена</th>
                  <th className="r">Комиссия</th>
                  <th className="r">Сумма</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
                  const total = t.side === 'buy' ? t.quantity * t.price + t.fee : t.quantity * t.price - t.fee
                  return (
                    <tr key={t.id}>
                      <td>{new Date(t.executedAt).toLocaleString('ru-RU')}</td>
                      <td><Badge tone={t.side === 'buy' ? 'positive' : 'negative'} size="sm">{t.side === 'buy' ? 'Покупка' : 'Продажа'}</Badge></td>
                      <td className="r ia-num">{NUM0.format(t.quantity)}</td>
                      <td className="r ia-num">{formatPrice(t.price, t.currency)}</td>
                      <td className="r ia-num">{formatPrice(t.fee, t.currency)}</td>
                      <td className="r ia-num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatPrice(total, t.currency)}</td>
                      <td className="r" style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="ia-table-icon-btn"
                          onClick={() => setEditingTrade(t)}
                          aria-label="Редактировать сделку"
                          title="Редактировать"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="ia-table-icon-btn"
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          aria-label="Удалить сделку"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="ia-modal__foot">
          <Button type="button" variant="ghost" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
      <TradeModal
        open={!!editingTrade}
        editTrade={editingTrade ? {
          id: editingTrade.id,
          ticker: editingTrade.ticker,
          side: editingTrade.side,
          quantity: editingTrade.quantity,
          price: editingTrade.price,
          fee: editingTrade.fee,
          currency: editingTrade.currency,
          executedAt: editingTrade.executedAt,
          accountId: editingTrade.accountId,
        } : undefined}
        onClose={() => {
          setEditingTrade(null)
          load()
        }}
      />
    </div>
  )
}
