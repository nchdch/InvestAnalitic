import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, TrendingUp, Layers, RotateCw } from 'lucide-react'
import { Button, Input, Select } from '../index'
import { injectOnce } from '../_internal/style'
import { getAccounts, createAccount, createTrade, getExchangeRate, getSecurityPrice, updateTrade } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { SecuritySearchInput } from './SecuritySearchInput'
import { MODAL_CSS } from './modalShared'
import { formatPrice } from '../../utils/format'
import type { SecuritySearchResult } from '../../api/client'
import type { Account } from '@/types'

const CURRENCIES = ['RUB', 'USD', 'EUR', 'CNY']
const today = () => new Date().toISOString().slice(0, 10)

export interface TradeModalInitial {
  accountId?: string
  ticker?: string
  name?: string
  assetType?: 'equity' | 'bond'
  exchange?: string
  currency?: string
  side?: 'buy' | 'sell'
}

interface Props {
  open: boolean
  onClose: () => void
  initial?: TradeModalInitial
  /** Если передан — форма открывается в режиме редактирования этой сделки. */
  editTrade?: {
    id: string
    ticker: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    fee: number
    currency: string
    executedAt: string
    accountId: string
    name?: string
    assetType?: 'equity' | 'bond'
    exchange?: string
  }
}

interface FormState {
  accountId: string
  ticker: string
  name: string
  assetType: 'equity' | 'bond'
  exchange: string
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
  exchange: 'MOEX',
  side: 'buy',
  quantity: '',
  price: '',
  fee: '',
  currency: 'RUB',
  exchangeRate: '',
  executedAt: today(),
}

export function TradeModal({ open, onClose, initial, editTrade }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [newAccName, setNewAccName] = useState('')
  const [newAccBroker, setNewAccBroker] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rateDate, setRateDate] = useState('')
  const [fetchingRate, setFetchingRate] = useState(false)
  const [priceLoaded, setPriceLoaded] = useState(false)
  const [priceUnavailable, setPriceUnavailable] = useState(false)
  const [fetchingPrice, setFetchingPrice] = useState(false)

  const needNewAccount = accounts.length === 0

  useEffect(() => {
    if (!open) return
    if (editTrade) {
      setForm({
        accountId: editTrade.accountId,
        ticker: editTrade.ticker,
        name: editTrade.name ?? '',
        assetType: editTrade.assetType ?? 'equity',
        exchange: editTrade.exchange ?? 'MOEX',
        side: editTrade.side,
        quantity: String(editTrade.quantity),
        price: String(editTrade.price),
        fee: String(editTrade.fee),
        currency: editTrade.currency,
        exchangeRate: '',
        executedAt: editTrade.executedAt.slice(0, 10),
      })
    } else {
      setForm({ ...EMPTY, executedAt: today(), ...initial })
    }
    setError('')
    setRateDate('')
    setPriceLoaded(false)
    setPriceUnavailable(false)
    setNewAccName('')
    setNewAccBroker('')
    getAccounts()
      .then((list) => {
        setAccounts(list)
        if (list.length > 0 && !initial?.accountId && !editTrade) {
          setForm((f) => ({ ...f, accountId: list[0].id }))
        }
      })
      .catch(() => setAccounts([]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Подтягиваем актуальную цену с MOEX при выборе бумаги
  const priceRequestRef = useRef(0)
  const loadPrice = useCallback((ticker: string, assetType: 'equity' | 'bond') => {
    if (!ticker.trim()) return
    const reqId = ++priceRequestRef.current
    setFetchingPrice(true)
    setPriceLoaded(false)
    setPriceUnavailable(false)
    getSecurityPrice(ticker.trim().toUpperCase(), assetType)
      .then((r) => {
        if (priceRequestRef.current !== reqId) return
        setForm((f) => ({ ...f, price: String(r.price), ...(r.currency ? { currency: r.currency } : {}) }))
        setPriceLoaded(true)
      })
      .catch(() => {
        if (priceRequestRef.current !== reqId) return
        setPriceUnavailable(true)
      })
      .finally(() => { if (priceRequestRef.current === reqId) setFetchingPrice(false) })
  }, [])

  useEffect(() => {
    if (!open) return
    if (editTrade) return          // ← добавить эту строку
    if (!form.ticker.trim()) return
    loadPrice(form.ticker, form.assetType)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ticker, form.assetType, open])

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
    if (!editTrade && form.currency !== 'RUB' && (!exchangeRate || exchangeRate <= 0)) return setError(`Введите курс ${form.currency} к ₽`)

    setSubmitting(true)
    try {
      if (editTrade) {
        // Режим редактирования
        await updateTrade(editTrade.id, {
          quantity: qty,
          price,
          fee: Number(form.fee) || 0,
          currency: form.currency,
          executedAt: form.executedAt ? new Date(form.executedAt).toISOString() : undefined,
          accountId: form.accountId || undefined,
        })
      } else {
        // Режим создания
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
          exchangeRate: form.currency !== 'RUB' ? Number(form.exchangeRate) : undefined,
          assetType: form.assetType,
          exchange: form.exchange,
          executedAt: form.executedAt ? new Date(form.executedAt).toISOString() : undefined,
        })
      }
      bump()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const qty = Number(form.quantity) || 0
  const priceNum = Number(form.price) || 0
  const feeNum = Number(form.fee) || 0
  const total = form.side === 'buy' ? qty * priceNum + feeNum : qty * priceNum - feeNum
  const showTotal = qty > 0 && priceNum > 0

  if (!open) return null

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label="Добавить сделку">
        <div className="ia-modal__head">
          <span className="ia-modal__title">{editTrade ? 'Редактировать сделку' : 'Добавить сделку'}</span>
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
            {editTrade ? (
              <div className="ia-modal-section-label" style={{ marginBottom: 4 }}>
                {form.assetType === 'equity' ? 'Акция' : 'Облигация'} · {form.ticker}
              </div>
            ) : (
              <div>
                <div className="ia-modal-section-label" style={{ marginBottom: 6 }}>Тип актива</div>
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
            )}

            {/* Направление */}
            {editTrade ? (
              <div className="ia-modal-section-label" style={{ marginBottom: 4 }}>
                {form.side === 'buy' ? 'Покупка' : 'Продажа'}
              </div>
            ) : (
              <div>
                <div className="ia-modal-section-label" style={{ marginBottom: 6 }}>Операция</div>
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
            )}

            {/* Поиск бумаги — только при создании */}
            {!editTrade && (
              <SecuritySearchInput
                selectedTicker={form.ticker}
                onSelect={(s: SecuritySearchResult) => {
                  set('ticker', s.ticker)
                  set('name', s.shortName)
                  if (s.assetType) set('assetType', s.assetType)
                  set('currency', s.currency)
                  set('exchange', s.exchange)
                }}
              />
            )}

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
                onChange={(e) => { set('price', e.target.value); setPriceLoaded(false); setPriceUnavailable(false) }}
                required
                hint={
                  priceLoaded ? 'Текущая цена с MOEX, можно изменить'
                  : priceUnavailable ? 'Не удалось получить цену с MOEX — введите вручную'
                  : undefined
                }
                suffix={
                  <button
                    type="button"
                    className={`ia-rate-refresh${fetchingPrice ? ' is-spinning' : ''}`}
                    onClick={() => loadPrice(form.ticker, form.assetType)}
                    disabled={fetchingPrice || !form.ticker.trim()}
                    aria-label="Обновить цену"
                    title="Обновить цену"
                  >
                    <RotateCw size={14} />
                  </button>
                }
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

            {/* Сумма сделки */}
            {showTotal && (
              <div className="ia-trade-total">
                <span className="ia-trade-total__label">
                  Сумма сделки {form.side === 'buy' ? '(с учётом комиссии)' : '(за вычетом комиссии)'}
                </span>
                <span className={`ia-trade-total__value${form.side === 'sell' ? ' is-sell' : ''}`}>
                  {formatPrice(total, form.currency)}
                </span>
              </div>
            )}
          </div>

          <div className="ia-modal__foot">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting}>
              {editTrade ? 'Сохранить' : form.side === 'buy' ? 'Купить' : 'Продать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
