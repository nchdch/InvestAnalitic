import type { Currency, IsoDateTime, TradeSide } from './common'

/** Сделка покупки/продажи — см. CLAUDE.md «Сделки (trades)». */
export interface Trade {
  id: string
  accountId: string
  ticker: string
  side: TradeSide
  quantity: number
  price: number
  fee: number
  currency: Currency
  executedAt: IsoDateTime
}
