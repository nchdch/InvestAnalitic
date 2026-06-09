import type { BondPosition, EquityPosition } from './position'
import type { CashBalance } from './account'
import type { Currency } from './common'

/** Строка таблицы акций: позиция + вычисленные поля для UI. */
export interface EquityRow {
  position: EquityPosition
  currentPrice: number
  currentValue: number
  investedValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  portfolioWeight: number
}

/** Строка таблицы облигаций: позиция + вычисленные поля для UI. */
export interface BondRow {
  position: BondPosition
  currentPrice: number
  currentValue: number
  investedValue: number
  ytm: number | null
  daysToMaturity: number | null
  unrealizedPnl: number
  unrealizedPnlPercent: number
  portfolioWeight: number
}

/** Строка денежных средств с эквивалентом в базовой валюте. */
export interface CashRow {
  balance: CashBalance
  rubEquivalent: number
  accountWeight: number
}

/** Данные одного счёта — всё что нужно для рендера блока счёта на главной странице. */
export interface AccountSummary {
  id: string
  name: string
  broker: string
  totalValue: number
  investedValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  portfolioWeight: number
  equityRows: EquityRow[]
  bondRows: BondRow[]
  cashRows: CashRow[]
}

/** Верхняя сводка всего портфеля. */
export interface PortfolioSummary {
  totalValue: number
  investedValue: number
  equityValue: number
  bondValue: number
  cashValue: number
  equityWeight: number
  bondWeight: number
  cashWeight: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  forwardDividendYield: number | null
  baseCurrency: Currency
}
