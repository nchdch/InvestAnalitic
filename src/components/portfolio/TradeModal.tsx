import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, TrendingUp, Layers, RotateCw } from 'lucide-react'
import { Button, Input, Select } from '../index'
import { injectOnce } from '../_internal/style'
import { getAccounts, createAccount, createTrade, getExchangeRate } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { SecuritySearchInput } from './SecuritySearchInput'
import { MODAL_CSS } from './modalShared'
import type { SecuritySearchResult } from '../../api/client'
import type { Account } from '@/types'

const CSS = `
.ia-toggle-row { display: flex; gap: 8px; }
.ia-toggle-btn {
  flex: 1; padding: 9px 14px; border-radius: var(--radius-md);
  border: 1px solid var(--border-1); background: transparent;
  cursor: pointer; font-family: inherit; font-size: var(--text-sm);
  font-weight: var(--fw-medium); color: var(--text-2);
  transition: all var(--dur-fast) var(--ease-out);
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.ia-toggle-btn:hover { background: var(--surface-sunken); color: var(--text-1); }
.ia-toggle-btn.is-active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-hover); font-weight: var(--fw-semibold); }
.ia-toggle-btn.is-sell.is-active { border-color: var(--loss); background: var(--loss-soft); color: var(--loss); }
.ia-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ia-rate-refresh {
  background: transparent; border: 0; cursor: pointer; color: var(--text-3);
  display: flex; align-items: center; padding: 0; line-height: 0;
  transition: color var(--dur-fast) var(--ease-out);
}
.ia-rate-refresh:hover:not(:disabled) { color: var(--accent); }
.ia-rate-refresh:disabled { cursor: default; }
.ia-rate-refresh.is-spinning svg { animation: ia-spin 0.7s linear infinite; }
@keyframes ia-spin { to { transform: rotate(360deg); } }
`

const CURRENCIES = ['RUB', 'USD', 'EUR', 'CNY']
const today = () => new Date().toISOString().slice(0, 10)

interface Props {
  open: boolean
  onClose: () => void
}

interface FormState {
  accountId: string
  ticker: string
  name: string
  assetType: 'equity' | 'bond'
  side: 'buy' | 'sell'
  quantity: string
  price: string
  fee: string
  currency: string
  exchangeRate: string
  executedAt: string
}

const EMPTY: FormState = {
  accountId: '',
  ticker: '',
  name: '',
  assetType: 'equity',
  side: 'buy',
  quantity: '',
  price: '',
  fee: '',
  currency: 'RUB',
  exchangeRate: '',
  executedAt: today(),
}

export function TradeModal({ open, onClose }: Props) {
  injectOnce('ia-modal', MODAL_CSS)
  injectOnce('ia-trade-modal', CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [newAccName, setNewAccName] = useState('')
  const [newAccBroker, setNewAccBroker] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rateDate, setRateDate] = useState('')
  const [fetchingRate, setFetchingRate] = useState(false)

  const needNewAccount = accounts.length === 0

  useEffect(() => {
    if (!open) return
    setForm({ ...EMPTY, executedAt: today() })
    setError('')
    setRateDate('')
    setNewAccName('')
    setNewAccBroker('')
    getAccounts()
      .then((list) => {
        setAccounts(list)
        if (list.length > 0) setForm((f) => ({ ...f, accountId: list[0].id }))
      })
      .catch(() => setAccounts([]))
  }, [open])

  // Подтягиваем актуальный курс ЦБ при выборе не-рублёвой валюты
  const rateRequestRef = useRef(0)
  const loadRate = useCallback((currency: string) => {
    if (currency === 'RUB') { setRateDate(''); return }
    const reqId = ++rateRequestRef.current
    setFetchingRate(true)
    getExchangeRate(currency)
      .then((r) => {
        if (rateRequestRef.current !== reqId) return
        setForm((f) => ({ ...f, exchangeRate: String(r.rate) }))
        setRateDate(r.date)
      })
      .catch(() => {})
      .finally(() => { if (rateRequestRef.current === reqId) setFetchingRate(false) })
  }, [])

  useEffect(() => {
    if (!open) return
    loadRate(form.currency)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.currency, open])

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const qty = Number(form.quantity)
    const price = Number(form.price)
    const exchangeRate = form.currency !== 'RUB' ? Number(form.exchangeRate) : 1
    if (!form.ticker.trim()) return setError('Введите тикер')
    if (!qty || qty <= 0) return setError('Количество должно быть больше 0')
    if (!price || price <= 0) return setError('Цена должна быть больше 0')
    if (form.currency !== 'RUB' && (!exchangeRate || exchangeRate <= 0)) return setError(`Введите курс ${form.currency} к ₽`)

    setSubmitting(true)
    try {
      let accountId = form.accountId

      if (needNewAccount) {
        if (!newAccName.trim()) return setError('Введите название портфеля')
        if (!newAccBroker.trim()) return setError('Введите брокера')
        const acc = await createAccount(newAccName.trim(), newAccBroker.trim())
        accountId = acc.id
      }

      await createTrade({
        accountId,
        ticker: form.ticker.trim().toUpperCase(),
        name: form.name.trim() || undefined,
        side: form.side,
        quantity: qty,
        price,
        fee: Number(form.fee) || 0,
        currency: form.currency,
        exchangeRate: form.currency !== 'RUB' ? exchangeRate : undefined,
        assetType: form.assetType,
        executedAt: form.executedAt ? new Date(form.executedAt).toISOString() : undefined,
      })

      bump()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label="Добавить сделку">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Добавить сделку</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ia-modal__body">
            {error && <div className="ia-modal-error">{error}</div>}

            {/* Портфель */}
            {needNewAccount ? (
              <>
                <div className="ia-modal-section-label">Новый портфель</div>
                <Input
                  label="Название портфеля"
                  placeholder="Сбер Инвестиции"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  required
                />
                <Input
                  label="Брокер"
                  placeholder="Сбербанк"
                  value={newAccBroker}
                  onChange={(e) => setNewAccBroker(e.target.value)}
                  required
                />
                <hr className="ia-modal-divider" />
                <div className="ia-modal-section-label">Сделка</div>
              </>
            ) : (
              <Select
                label="Портфель"
                value={form.accountId}
                onChange={(e) => set('accountId', e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} — {a.broker}</option>
                ))}
              </Select>
            )}

            {/* Тип актива */}
            <div>
              <div className="ia-modal-section-label" style={{ marginBottom: 8 }}>Тип актива</div>
              <div className="ia-toggle-row">
                <button
                  type="button"
                  className={`ia-toggle-btn${form.assetType === 'equity' ? ' is-active' : ''}`}
                  onClick={() => set('assetType', 'equity')}
                >
                  <TrendingUp size={15} /> Акция
                </button>
                <button
                  type="button"
                  className={`ia-toggle-btn${form.assetType === 'bond' ? ' is-active' : ''}`}
                  onClick={() => set('assetType', 'bond')}
                >
                  <Layers size={15} /> Облигация
                </button>
              </div>
            </div>

            {/* Направление */}
            <div>
              <div className="ia-modal-section-label" style={{ marginBottom: 8 }}>Операция</div>
              <div className="ia-toggle-row">
                <button
                  type="button"
                  className={`ia-toggle-btn${form.side === 'buy' ? ' is-active' : ''}`}
                  onClick={() => set('side', 'buy')}
                >
                  Покупка
                </button>
                <button
                  type="button"
                  className={`ia-toggle-btn is-sell${form.side === 'sell' ? ' is-active' : ''}`}
                  onClick={() => set('side', 'sell')}
                >
                  Продажа
                </button>
              </div>
            </div>

            {/* Поиск бумаги */}
            <SecuritySearchInput
              selectedTicker={form.ticker}
              onSelect={(s: SecuritySearchResult) => {
                set('ticker', s.ticker)
                set('name', s.shortName)
                if (s.assetType) set('assetType', s.assetType)
                set('currency', s.currency)
              }}
            />

            {/* Кол-во + цена */}
            <div className="ia-field-row">
              <Input
                label="Количество"
                type="number"
                min="0"
                step="1"
                placeholder="100"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                required
              />
              <Input
                label="Цена"
                type="number"
                min="0"
                step="any"
                placeholder="286.50"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                required
              />
            </div>

            {/* Комиссия + валюта */}
            <div className="ia-field-row">
              <Input
                label="Комиссия"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={form.fee}
                onChange={(e) => set('fee', e.target.value)}
              />
              <Select
                label="Валюта"
                value={form.currency}
                onChange={(e) => {
                  set('currency', e.target.value)
                  if (e.target.value === 'RUB') set('exchangeRate', '')
                }}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            {/* Курс валюты — только для не-рублёвых позиций */}
            {form.currency !== 'RUB' && (
              <Input
                label={`Курс ${form.currency} к ₽`}
                type="number"
                min="0"
                step="any"
                placeholder={form.currency === 'USD' ? '91.50' : form.currency === 'EUR' ? '98.00' : '12.50'}
                value={form.exchangeRate}
                onChange={(e) => set('exchangeRate', e.target.value)}
                required
                hint={rateDate ? `Курс ЦБ РФ на ${new Date(rateDate).toLocaleDateString('ru-RU')}, можно изменить` : undefined}
                suffix={
                  <button
                    type="button"
                    className={`ia-rate-refresh${fetchingRate ? ' is-spinning' : ''}`}
                    onClick={() => loadRate(form.currency)}
                    disabled={fetchingRate}
                    aria-label="Обновить курс"
                    title="Обновить курс"
                  >
                    <RotateCw size={14} />
                  </button>
                }
              />
            )}

            {/* Дата */}
            <Input
              label="Дата сделки"
              type="date"
              value={form.executedAt}
              onChange={(e) => set('executedAt', e.target.value)}
            />
          </div>

          <div className="ia-modal__foot">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting}>
              {form.side === 'buy' ? 'Купить' : 'Продать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
