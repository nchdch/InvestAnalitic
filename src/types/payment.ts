import type { Currency, IsoDate } from './common'

export type PaymentType = 'dividend' | 'coupon'

/** Выплата дивидендов или купона — см. CLAUDE.md «Дивиденды и купоны». */
export interface Payment {
  id: string
  accountId: string
  ticker: string
  type: PaymentType
  paymentDate: IsoDate
  grossAmount: number
  taxWithheld: number
  netAmount: number
  currency: Currency
}
