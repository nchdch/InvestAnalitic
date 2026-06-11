import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button, Select } from '../index'
import { injectOnce } from '../_internal/style'
import { getAccounts, getPositions, updatePosition } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'
import type { Account, Position } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  position: Position
}

export function TransferPositionModal({ open, onClose, position }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [targetId, setTargetId] = useState('')
  const [conflict, setConflict] = useState(false)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setConflict(false)
    getAccounts()
      .then((list) => {
        const targets = list.filter((a) => a.id !== position.accountId)
        setAccounts(targets)
        setTargetId(targets[0]?.id ?? '')
      })
      .catch(() => setAccounts([]))
  }, [open, position.accountId])

  useEffect(() => {
    if (!open || !targetId) { setConflict(false); return }
    setChecking(true)
    getPositions(targetId)
      .then((list) => setConflict(list.some((p) => p.ticker === position.ticker)))
      .catch(() => setConflict(false))
      .finally(() => setChecking(false))
  }, [open, targetId, position.ticker])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!targetId) return setError('Выберите счёт назначения')
    if (conflict) return setError('На выбранном счёте уже есть позиция по этой бумаге — перенос невозможен')

    setSubmitting(true)
    try {
      await updatePosition(position.id, { accountId: targetId })
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
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label="Перенести позицию">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Перенести позицию · {position.ticker}</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ia-modal__body">
            {error && <div className="ia-modal-error">{error}</div>}

            {accounts.length === 0 ? (
              <div className="ia-modal-error">Нет других счетов для переноса — сначала создайте ещё один портфель</div>
            ) : (
              <Select
                label="Перенести на счёт"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.broker}</option>)}
              </Select>
            )}

            {conflict && (
              <div className="ia-modal-error">
                На выбранном счёте уже есть позиция {position.ticker} — объединение позиций не поддерживается, выберите другой счёт.
              </div>
            )}
          </div>

          <div className="ia-modal__foot">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting} disabled={accounts.length === 0 || conflict || checking}>
              Перенести
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
