import React, { useEffect, useMemo, useState } from 'react'
import {
  X, ChevronLeft, Search, Building2, TrendingUp, Bitcoin, Home, Percent,
  CreditCard, Wallet, Landmark, Briefcase, Banknote, Package, Boxes,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, Input, Avatar } from '../index'
import { injectOnce } from '../_internal/style'
import { createAccount } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'

const CSS = `
.ia-pf-step-label { font-size: var(--text-xs); font-weight: var(--fw-semibold); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-3); margin-bottom: 4px; }
.ia-pf-step-title { font-size: var(--text-h4); font-weight: var(--fw-bold); color: var(--text-1); margin-bottom: 4px; }
.ia-pf-step-sub { font-size: var(--text-sm); color: var(--text-3); }
.ia-pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ia-pf-tile {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid var(--border-1); border-radius: var(--radius-md);
  background: transparent; cursor: pointer; font-family: inherit; font-size: var(--text-sm);
  font-weight: var(--fw-medium); color: var(--text-2); text-align: left;
  transition: all var(--dur-fast) var(--ease-out);
}
.ia-pf-tile:hover:not(:disabled) { background: var(--surface-sunken); color: var(--text-1); }
.ia-pf-tile.is-active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-hover); font-weight: var(--fw-semibold); }
.ia-pf-tile:disabled { opacity: .4; cursor: not-allowed; }
.ia-pf-tile__icon {
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 30px; height: 30px; border-radius: var(--radius-md);
  background: var(--accent-soft); color: var(--accent-hover);
}
.ia-pf-tile:disabled .ia-pf-tile__icon { background: var(--surface-sunken); color: var(--text-4); }
.ia-pf-broker-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 264px; overflow-y: auto; padding-right: 2px; }
`

interface TypeOption {
  id: string
  label: string
  Icon: LucideIcon
  enabled: boolean
}

const TYPES: TypeOption[] = [
  { id: 'investment', label: 'Инвестиции', Icon: TrendingUp, enabled: true },
  { id: 'crypto', label: 'Криптокошелёк', Icon: Bitcoin, enabled: false },
  { id: 'realestate', label: 'Недвижимость', Icon: Home, enabled: false },
  { id: 'deposit', label: 'Депозит', Icon: Percent, enabled: false },
  { id: 'debit', label: 'Дебетовая карта', Icon: CreditCard, enabled: false },
  { id: 'credit', label: 'Кредитная карта', Icon: Wallet, enabled: false },
  { id: 'bank', label: 'Банковский счёт', Icon: Landmark, enabled: false },
  { id: 'business', label: 'Бизнес', Icon: Briefcase, enabled: false },
  { id: 'cash', label: 'Наличные', Icon: Banknote, enabled: false },
  { id: 'other', label: 'Прочее', Icon: Package, enabled: false },
  { id: 'composite', label: 'Составные', Icon: Boxes, enabled: false },
]

const BROKERS = [
  'Т-Инвестиции', 'СберИнвестиции', 'ВТБ Инвестиции', 'Альфа-Инвестиции',
  'БКС', 'Открытие Инвестиции', 'Финам', 'Газпромбанк Инвестиции',
  'Райффайзен', 'Россельхозбанк', 'Совкомбанк', 'Промсвязьбанк',
  'Атон', 'Уралсиб', 'Цифра брокер', 'Freedom Finance',
  'Solidbroker', 'Interactive Brokers',
]

const OTHER = '__other__'

interface Props {
  open: boolean
  onClose: () => void
}

export function PortfolioModal({ open, onClose }: Props) {
  injectOnce('ia-modal', MODAL_CSS)
  injectOnce('ia-pf-modal', CSS)

  const bump = usePortfolioStore((s) => s.bump)

  const [step, setStep] = useState<1 | 2>(1)
  const [type, setType] = useState('investment')
  const [search, setSearch] = useState('')
  const [broker, setBroker] = useState<string | null>(null)
  const [customBroker, setCustomBroker] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep(1)
    setType('investment')
    setSearch('')
    setBroker(null)
    setCustomBroker('')
    setName('')
    setError('')
  }, [open])

  const filteredBrokers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? BROKERS.filter((b) => b.toLowerCase().includes(q)) : BROKERS
  }, [search])

  const handleSelectBroker = (b: string) => {
    setBroker(b)
    if (b !== OTHER && !name.trim()) setName(b)
  }

  const handleCreate = async () => {
    setError('')
    const brokerName = broker === OTHER ? customBroker.trim() : (broker ?? '')
    if (!brokerName) return setError('Выберите брокера')
    if (!name.trim()) return setError('Введите название портфеля')

    setSubmitting(true)
    try {
      await createAccount(name.trim(), brokerName)
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
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label="Новый портфель">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Новый портфель</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <div className="ia-modal__body">
          {error && <div className="ia-modal-error">{error}</div>}

          {step === 1 && (
            <>
              <div>
                <div className="ia-pf-step-label">Шаг 1</div>
                <div className="ia-pf-step-title">Создание портфеля</div>
                <div className="ia-pf-step-sub">Выберите тип портфеля</div>
              </div>
              <div className="ia-pf-grid">
                {TYPES.map(({ id, label, Icon, enabled }) => (
                  <button
                    key={id}
                    type="button"
                    className={`ia-pf-tile${type === id ? ' is-active' : ''}`}
                    disabled={!enabled}
                    title={enabled ? undefined : 'Скоро будет доступно'}
                    onClick={() => setType(id)}
                  >
                    <span className="ia-pf-tile__icon"><Icon size={15} /></span>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <div className="ia-pf-step-label">Шаг 2</div>
                <div className="ia-pf-step-title">Выберите брокера</div>
                <div className="ia-pf-step-sub">Платформу, через которую вы инвестируете</div>
              </div>

              <Input
                placeholder="Название брокера"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<Search size={15} />}
              />

              <div className="ia-pf-broker-grid">
                {filteredBrokers.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`ia-pf-tile${broker === b ? ' is-active' : ''}`}
                    onClick={() => handleSelectBroker(b)}
                  >
                    <Avatar name={b} size="sm" />
                    {b}
                  </button>
                ))}
                <button
                  type="button"
                  className={`ia-pf-tile${broker === OTHER ? ' is-active' : ''}`}
                  onClick={() => handleSelectBroker(OTHER)}
                >
                  <span className="ia-pf-tile__icon"><Building2 size={15} /></span>
                  Другой брокер
                </button>
              </div>

              {broker === OTHER && (
                <Input
                  label="Название брокера"
                  placeholder="Например, ИнвестБанк"
                  value={customBroker}
                  onChange={(e) => setCustomBroker(e.target.value)}
                  required
                />
              )}

              {broker && (
                <Input
                  label="Название портфеля"
                  placeholder="Например, Сбер Инвестиции"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
            </>
          )}
        </div>

        <div className="ia-modal__foot">
          {step === 1 ? (
            <>
              <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
              <Button type="button" onClick={() => setStep(2)}>Далее</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" leftIcon={<ChevronLeft size={16} />} onClick={() => setStep(1)} disabled={submitting}>
                Назад
              </Button>
              <Button type="button" loading={submitting} onClick={handleCreate}>Создать портфель</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
