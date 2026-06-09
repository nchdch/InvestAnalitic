import type { Currency } from './common'

/** Портфель пользователя (брокерский счёт) — узел иерархии «Портфель → Счёт → ...» из CLAUDE.md. */
export interface Account {
  id: string
  name: string
  broker: string
}

export interface CashBalance {
  accountId: string
  currency: Currency
  amount: number
}
