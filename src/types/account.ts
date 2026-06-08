import type { Currency } from './common'

/** Брокерский счёт пользователя — узел иерархии «Портфель → Счёт → ...» из CLAUDE.md. */
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
