import { useEffect, useMemo, useState } from 'react'
import type { AccountSummary, Payment } from '@/types'
import { getPayments } from '../api/client'

export type UpcomingPaymentType = 'coupon' | 'amortization' | 'redemption'

/** Будущая выплата по облигации — следующий купон или ближайшее событие графика амортизации/погашения. */
export interface UpcomingPayment {
  id: string
  date: string
  ticker: string
  name?: string
  accountName: string
  type: UpcomingPaymentType
  perUnit: number | null
  amount: number
  currency: string
  daysUntil: number
}

/** Историческая выплата (дивиденд/купон) с привязкой к названию счёта. */
export interface PaymentHistoryRow extends Payment {
  accountName: string
}

export interface UseCalendarResult {
  isLoading: boolean
  error: string | null
  upcoming: UpcomingPayment[]
  history: PaymentHistoryRow[]
  /** Сумма ожидаемых купонов/амортизаций в рублях за ближайшие 30 дней. */
  upcoming30dTotal: number
  /** Сумма выплат (после налога) в рублях, полученных с начала текущего календарного года. */
  receivedThisYearTotal: number
  /** Форвардная доходность портфеля: текущая доходность облигаций + дивиденды за 12 мес, % к стоимости портфеля. */
  forwardYield: number | null
}

/** Календарь выплат: ближайшие купоны/амортизации облигаций (из справочника MOEX) + история дивидендов и купонов. */
export function useCalendar(accounts: AccountSummary[]): UseCalendarResult {
  const accountsKey = accounts.map((a) => `${a.id}:${a.name}`).join(',')
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountsKey) {
      setPayments([])
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const ids = accountsKey.split(',').map((s) => s.slice(0, s.indexOf(':')))

    Promise.all(ids.map((id) => getPayments(id).catch((): Payment[] => [])))
      .then((byAccount) => { if (!cancelled) setPayments(byAccount.flat()) })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)) })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [accountsKey])

  const accountNameById = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts])

  const upcoming = useMemo<UpcomingPayment[]>(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayMs = new Date(today).getTime()
    const items: UpcomingPayment[] = []

    for (const account of accounts) {
      for (const row of account.bondRows) {
        const pos = row.position

        if (pos.nextCouponDate && pos.nextCouponDate >= today && pos.nextCouponValue != null) {
          items.push({
            id: `${pos.id}-coupon-${pos.nextCouponDate}`,
            date: pos.nextCouponDate,
            ticker: pos.ticker,
            name: pos.name,
            accountName: account.name,
            type: 'coupon',
            perUnit: pos.nextCouponValue,
            amount: pos.nextCouponValue * pos.quantity,
            currency: pos.currency,
            daysUntil: 0,
          })
        }

        for (const event of pos.amortization ?? []) {
          if (event.date < today) continue
          const isRedemption = event.date === pos.maturityDate
          items.push({
            id: `${pos.id}-${isRedemption ? 'redemption' : 'amortization'}-${event.date}`,
            date: event.date,
            ticker: pos.ticker,
            name: pos.name,
            accountName: account.name,
            type: isRedemption ? 'redemption' : 'amortization',
            perUnit: event.value,
            amount: event.value * pos.quantity,
            currency: pos.currency,
            daysUntil: 0,
          })
        }
      }
    }

    for (const item of items) {
      item.daysUntil = Math.round((new Date(item.date).getTime() - todayMs) / 86_400_000)
    }

    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [accounts])

  const history = useMemo<PaymentHistoryRow[]>(() => {
    return [...payments]
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
      .map((p) => ({ ...p, accountName: accountNameById.get(p.accountId) ?? '—' }))
  }, [payments, accountNameById])

  const upcoming30dTotal = useMemo(() => upcoming
    .filter((u) => u.currency === 'RUB' && u.daysUntil >= 0 && u.daysUntil <= 30)
    .reduce((s, u) => s + u.amount, 0), [upcoming])

  const receivedThisYearTotal = useMemo(() => {
    const year = String(new Date().getFullYear())
    return history
      .filter((p) => p.currency === 'RUB' && p.paymentDate.startsWith(year))
      .reduce((s, p) => s + p.netAmount, 0)
  }, [history])

  const forwardYield = useMemo(() => {
    const totalValue = accounts.reduce((s, a) => s + a.totalValue, 0)
    if (totalValue <= 0) return null

    const annualBondIncome = accounts.reduce((s, a) => s + a.bondRows.reduce(
      (sum, row) => sum + (row.currentYield != null ? (row.currentYield / 100) * row.currentValue : 0), 0,
    ), 0)

    const yearAgo = new Date()
    yearAgo.setDate(yearAgo.getDate() - 365)
    const yearAgoStr = yearAgo.toISOString().slice(0, 10)
    const trailingDividends = history
      .filter((p) => p.type === 'dividend' && p.currency === 'RUB' && p.paymentDate >= yearAgoStr)
      .reduce((s, p) => s + p.netAmount, 0)

    return (annualBondIncome + trailingDividends) / totalValue * 100
  }, [accounts, history])

  return { isLoading, error, upcoming, history, upcoming30dTotal, receivedThisYearTotal, forwardYield }
}
