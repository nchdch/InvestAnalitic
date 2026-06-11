import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button, Input } from '../index'
import { injectOnce } from '../_internal/style'
import { updatePosition } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'
import type { Position } from '@/types'

const NUM = new Intl.NumberFormat('ru-RU')

interface Props {
  open: boolean
  onClose: () => void
  position: Position
}

export function EditQuantityModal({ open, onClose, position }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setQuantity(String(position.quantity))
    setError('')
  }, [open, position.quantity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty < 0) return setError('Количество должно быть числом не меньше 0')

    setSubmitting(true)
    try {
      await updatePosition(position.id, { quantity: qty })
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
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label="Изменить количество">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Изменить количество · {position.ticker}</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ia-modal__body">
            {error && <div className="ia-modal-error">{error}</div>}
            <Input
              label="Количество"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              hint={`Текущее количество: ${NUM.format(position.quantity)}`}
              required
            />
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
