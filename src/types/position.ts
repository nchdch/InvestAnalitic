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

/** График амортизации облигации: дата выплаты, доля от номинала (%), сумма на бумагу. */
export interface BondAmortizationEvent {
  date: string
  valuePrc: number
  value: number
}

/** Параметры выпуска облигации, дополняющие позицию (см. CLAUDE.md «Для облигаций дополнительно»). */
export interface BondPosition extends PositionBase {
  assetType: 'bond'
  faceValue: number
  couponRate: number
  couponDates: string[]
  maturityDate: string
  accruedInterest: number
  /** Размер лота в штуках облигаций (с MOEX, обычно 1). */
  lotSize?: number
  /** Дата ближайшей купонной выплаты. */
  nextCouponDate?: string
  /** Сумма ближайшего купона на одну облигацию. */
  nextCouponValue?: number
  /** Текущий НКД на одну облигацию (на сегодня, по данным MOEX). */
  currentAccruedInterest?: number
  /** Первоначальный номинал при размещении (до амортизации). */
  initialFaceValue?: number
  /** Будущие амортизационные выплаты (включая полное погашение в дату MATDATE). */
  amortization?: BondAmortizationEvent[]
  /** Дата ближайшей оферты/колл-опциона, если есть. */
  offerDate?: string
  /** Когда последний раз обновлялись справочные данные с MOEX. */
  bondInfoUpdatedAt?: string
}

export type Position = EquityPosition | BondPosition
