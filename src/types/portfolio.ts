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
  dayChange: number | null
  dayChangePercent: number | null
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
  dayChange: number | null
  dayChangePercent: number | null
  /** Текущая доходность купона к текущей цене, % годовых. */
  currentYield: number | null
  /** Сумма полученных купонов по позиции (после налога), ₽. */
  couponIncome: number
  /** Суммарная прибыль: переоценка + купоны, ₽. */
  totalPnl: number
  /** Суммарная доходность к вложенным средствам, %. */
  totalPnlPercent: number
  portfolioWeight: number
}

/** Строка денежных средств с эквивалентом в базовой валюте. */
export interface CashRow {
  balance: CashBalance
  /** Курс валюты к рублю (1 для RUB). */
  rate: number
  rubEquivalent: number
  accountWeight: number
  portfolioWeight: number
}

/** Данные одного портфеля — всё что нужно для рендера блока портфеля на главной странице. */
export interface AccountSummary {
  id: string
  name: string
  broker: string
  totalValue: number
  investedValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  dayChange: number
  portfolioWeight: number
  equityRows: EquityRow[]
  bondRows: BondRow[]
  cashRows: CashRow[]
}

/** Верхняя сводка всего портфеля. */
export interface PortfolioSummary {
  totalValue: number
  investedValue: number
  dayChange: number
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
