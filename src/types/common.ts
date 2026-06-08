/** Базовая валюта портфеля по умолчанию — рубль (см. CLAUDE.md, раздел «Учёт позиций»). */
export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY' | string

export type Exchange = 'MOEX' | 'SPB' | 'NYSE' | 'NASDAQ' | string

export type AssetType = 'equity' | 'bond'

export type TradeSide = 'buy' | 'sell'

export type AveragingMethod = 'FIFO' | 'WAVG'

/** ISO-дата без времени, формат YYYY-MM-DD. */
export type IsoDate = string

/** ISO-дата со временем (date-time). */
export type IsoDateTime = string
