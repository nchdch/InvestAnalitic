import type { AveragingMethod, Currency, Exchange } from './common'

interface PositionBase {
  id: string
  accountId: string
  ticker: string
  isin?: string
  name?: string
  exchange: Exchange
  currency: Currency
  quantity: number
  averagePrice: number
  averagingMethod: AveragingMethod
}

export interface EquityPosition extends PositionBase {
  assetType: 'equity'
}

/** Параметры выпуска облигации, дополняющие позицию (см. CLAUDE.md «Для облигаций дополнительно»). */
export interface BondPosition extends PositionBase {
  assetType: 'bond'
  faceValue: number
  couponRate: number
  couponDates: string[]
  maturityDate: string
  accruedInterest: number
}

export type Position = EquityPosition | BondPosition
