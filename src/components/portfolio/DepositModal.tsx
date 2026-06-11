import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Button, Input, Select } from '../index'
import { injectOnce } from '../_internal/style'
import { getAccounts, createCashTransaction, getExchangeRate } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'
import type { Account } from '@/types'

const CURRENCIES = ['RUB', 'USD', 'EUR', 'CNY']

export interface DepositModalInitial {
  accountId?: string
  currency?: string
  direction?: 'deposit' | 'withdrawal'
}

interface Props {
  open: boolean
  onClose: () => void
  /** Предзаполнение формы при открытии из контекстного меню денежного остатка («Пополнить»/«Списать»). */
  initial?: DepositModalInitial
}

interface FormState {
  accountId: string
  direction: 'deposit' | 'withdrawal'
  amount: string
  currency: string
}

const EMPTY: FormState = {
  accountId: '',
  direction: 'deposit',
  amount: '',
  currency: 'RUB',
}

export function DepositModal({ open, onClose, initial }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rate, setRate] = useState<number | null>(null)
  const [rateDate, setRateDate] = useState('')

  useEffect(() => {
    if (!open) return
    setForm({ ...EMPTY, ...initial })
    setError('')
    setRate(null)
    setRateDate('')
    getAccounts()
      .then((list) => {
        setAccounts(list)
        if (list.length > 0 && !initial?.accountId) setForm((f) => ({ ...f, accountId: list[0].id }))
      })
      .catch(() => setAccounts([]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Подтягиваем курс ЦБ для отображения эквивалента в рублях
  const rateRequestRef = useRef(0)
  useEffect(() => {
    if (!open) return
    if (form.currency === 'RUB') { setRate(null); setRateDate(''); return }
    const reqId = ++rateRequestRef.current
    getExchangeRate(form.currency)
      .then((r) => {
        if (rateRequestRef.current !== reqId) return
        setRate(r.rate)
        setRateDate(r.date)
      })
      .catch(() => {})
  }, [form.currency, open])

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amt = Number(form.amount)
    if (!form.accountId) return setError('Выберите портфель')
    if (!amt || amt <= 0) return setError('Сумма должна быть больше 0')

    setSubmitting(true)
    try {
      await createCashTransaction({
        accountId: form.accountId,
        currency: form.currency,
        amount: form.direction === 'withdrawal' ? -amt : amt,
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

  const amountNum = Number(form.amount)
  const showRubHint = form.currency !== 'RUB' && rate != null && amountNum > 0

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label="Добавить депозит">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Добавить депозит</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ia-modal__body">
            {error && <div className="ia-modal-error">{error}</div>}

            {accounts.length === 0 ? (
              <div className="ia-modal-error">Сначала создайте портфель — добавьте его через меню «Действие»</div>
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

            {/* Операция */}
            <div>
              <div className="ia-modal-section-label" style={{ marginBottom: 8 }}>Операция</div>
              <div className="ia-toggle-row">
                <button
                  type="button"
                  className={`ia-toggle-btn${form.direction === 'deposit' ? ' is-active' : ''}`}
                  onClick={() => set('direction', 'deposit')}
                >
                  <ArrowDownToLine size={15} /> Пополнение
                </button>
                <button
                  type="button"
                  className={`ia-toggle-btn is-sell${form.direction === 'withdrawal' ? ' is-active' : ''}`}
                  onClick={() => set('direction', 'withdrawal')}
                >
                  <ArrowUpFromLine size={15} /> Списание
                </button>
              </div>
            </div>

            {/* Сумма + валюта */}
            <div className="ia-field-row">
              <Input
                label="Сумма"
                type="number"
                min="0"
                step="any"
                placeholder="50000"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                required
                hint={showRubHint ? `≈ ${(amountNum * (rate ?? 0)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽ по курсу ЦБ на ${new Date(rateDate).toLocaleDateString('ru-RU')}` : undefined}
              />
              <Select
                label="Валюта"
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>

          <div className="ia-modal__foot">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting} disabled={accounts.length === 0}>
              {form.direction === 'deposit' ? 'Пополнить' : 'Списать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
