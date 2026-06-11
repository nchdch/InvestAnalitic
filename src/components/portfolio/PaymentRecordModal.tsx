import React, { useState, useEffect, useCallback } from 'react'
import { X, Coins, TrendingDown, Flag } from 'lucide-react'
import { Button, Input } from '../index'
import { injectOnce } from '../_internal/style'
import { createPayment } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'
import { formatPrice } from '../../utils/format'
import type { Position, PaymentType } from '@/types'

const today = () => new Date().toISOString().slice(0, 10)

interface Props {
  open: boolean
  onClose: () => void
  accountId: string
  position: Position
}

interface FormState {
  type: PaymentType
  paymentDate: string
  grossAmount: string
  taxWithheld: string
}

const BOND_TYPES: { value: PaymentType; label: string; icon: React.ReactNode }[] = [
  { value: 'coupon', label: 'Купон', icon: <Coins size={15} /> },
  { value: 'amortization', label: 'Амортизация', icon: <TrendingDown size={15} /> },
  { value: 'redemption', label: 'Погашение', icon: <Flag size={15} /> },
]

/** Подсказка по сумме выплаты на основе справочных данных MOEX по облигации. */
function suggestGross(type: PaymentType, position: Position): number | null {
  if (position.assetType !== 'bond') return null
  const qty = position.quantity
  if (type === 'coupon') {
    return position.nextCouponValue != null ? position.nextCouponValue * qty : null
  }
  if (type === 'amortization') {
    const ev = position.amortization?.find((e) => e.date !== position.maturityDate)
    return ev ? ev.value * qty : null
  }
  if (type === 'redemption') {
    const ev = position.amortization?.find((e) => e.date === position.maturityDate)
    if (ev) return ev.value * qty
    return position.faceValue != null ? position.faceValue * qty : null
  }
  return null
}

/** Подсказка по дате выплаты на основе справочных данных MOEX по облигации. */
function suggestDate(type: PaymentType, position: Position): string {
  if (position.assetType === 'bond') {
    if (type === 'coupon' && position.nextCouponDate) return position.nextCouponDate.slice(0, 10)
    if (type === 'amortization') {
      const ev = position.amortization?.find((e) => e.date !== position.maturityDate)
      if (ev) return ev.date.slice(0, 10)
    }
    if (type === 'redemption') return position.maturityDate.slice(0, 10)
  }
  return today()
}

function buildForm(type: PaymentType, position: Position): FormState {
  const gross = suggestGross(type, position)
  const taxRate = type === 'dividend' || type === 'coupon' ? 0.13 : 0
  const tax = gross != null ? Math.round(gross * taxRate * 100) / 100 : 0
  return {
    type,
    paymentDate: suggestDate(type, position),
    grossAmount: gross != null ? String(Math.round(gross * 100) / 100) : '',
    taxWithheld: String(tax),
  }
}

export function PaymentRecordModal({ open, onClose, accountId, position }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const isBond = position.assetType === 'bond'
  const [form, setForm] = useState<FormState>(() => buildForm(isBond ? 'coupon' : 'dividend', position))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(buildForm(isBond ? 'coupon' : 'dividend', position))
    setError('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
  }, [])

  const handleTypeChange = (type: PaymentType) => {
    setForm(buildForm(type, position))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const gross = Number(form.grossAmount)
    const tax = Number(form.taxWithheld) || 0
    if (!gross || gross <= 0) return setError('Сумма до налога должна быть больше 0')
    if (tax < 0) return setError('Налог не может быть отрицательным')

    const net = Math.round((gross - tax) * 100) / 100

    setSubmitting(true)
    try {
      await createPayment({
        accountId,
        ticker: position.ticker,
        type: form.type,
        paymentDate: form.paymentDate || today(),
        grossAmount: gross,
        taxWithheld: tax,
        netAmount: net,
        currency: position.currency,
      })
      bump()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const grossNum = Number(form.grossAmount) || 0
  const taxNum = Number(form.taxWithheld) || 0
  const net = Math.round((grossNum - taxNum) * 100) / 100

  if (!open) return null

  const title = isBond ? 'Выплата по облигации' : 'Дивиденды'

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ia-modal__head">
          <span className="ia-modal__title">{title} · {position.ticker}</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ia-modal__body">
            {error && <div className="ia-modal-error">{error}</div>}

            {isBond && (
              <div>
                <div className="ia-modal-section-label" style={{ marginBottom: 6 }}>Тип выплаты</div>
                <div className="ia-toggle-row">
                  {BOND_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`ia-toggle-btn${form.type === t.value ? ' is-active' : ''}`}
                      onClick={() => handleTypeChange(t.value)}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Input
              label="Дата выплаты"
              type="date"
              value={form.paymentDate}
              onChange={(e) => set('paymentDate', e.target.value)}
            />

            <div className="ia-field-row">
              <Input
                label="Сумма до налога"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={form.grossAmount}
                onChange={(e) => set('grossAmount', e.target.value)}
                required
                hint={
                  isBond && suggestGross(form.type, position) != null
                    ? 'Подсказка рассчитана по справочным данным MOEX, можно изменить'
                    : undefined
                }
              />
              <Input
                label="Налог удержан"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={form.taxWithheld}
                onChange={(e) => set('taxWithheld', e.target.value)}
              />
            </div>

            {grossNum > 0 && (
              <div className="ia-trade-total">
                <span className="ia-trade-total__label">К получению</span>
                <span className="ia-trade-total__value">{formatPrice(net, position.currency)}</span>
              </div>
            )}
          </div>

          <div className="ia-modal__foot">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting}>
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
