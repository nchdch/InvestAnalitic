import { useState, useEffect } from 'react'
import type { AccountSummary, PortfolioSummary } from '@/types'

export interface UsePortfolioResult {
  summary: PortfolioSummary | null
  accounts: AccountSummary[]
  isLoading: boolean
  error: string | null
}

// Мок-данные для разработки UI до подключения реального API
const MOCK_SUMMARY: PortfolioSummary = {
  totalValue: 2_874_320,
  equityValue: 1_896_051,
  bondValue: 862_296,
  cashValue: 115_973,
  equityWeight: 65.96,
  bondWeight: 29.99,
  cashWeight: 4.04,
  unrealizedPnl: 312_540,
  unrealizedPnlPercent: 12.19,
  forwardDividendYield: 8.4,
  baseCurrency: 'RUB',
}

const MOCK_ACCOUNTS: AccountSummary[] = [
  {
    id: '1',
    name: 'Сбер Инвестиции',
    broker: 'Сбербанк',
    totalValue: 1_923_480,
    unrealizedPnl: 218_340,
    portfolioWeight: 66.92,
    equityRows: [
      {
        position: {
          id: 'p1', accountId: '1', ticker: 'SBER', name: 'Сбербанк', exchange: 'MOEX',
          currency: 'RUB', quantity: 500, averagePrice: 246.5, averagingMethod: 'WAVG',
          assetType: 'equity',
        },
        currentPrice: 286.2,
        currentValue: 143_100,
        unrealizedPnl: 19_850,
        unrealizedPnlPercent: 16.12,
        portfolioWeight: 4.98,
      },
      {
        position: {
          id: 'p2', accountId: '1', ticker: 'LKOH', name: 'Лукойл', exchange: 'MOEX',
          currency: 'RUB', quantity: 100, averagePrice: 6_820, averagingMethod: 'WAVG',
          assetType: 'equity',
        },
        currentPrice: 7_412,
        currentValue: 741_200,
        unrealizedPnl: 59_200,
        unrealizedPnlPercent: 8.68,
        portfolioWeight: 25.78,
      },
    ],
    bondRows: [
      {
        position: {
          id: 'p3', accountId: '1', ticker: 'ОФЗ 26238', name: 'ОФЗ 26238',
          exchange: 'MOEX', currency: 'RUB', quantity: 30, averagePrice: 96.5,
          averagingMethod: 'WAVG', assetType: 'bond',
          faceValue: 1000, couponRate: 7.1, couponDates: [], maturityDate: '2041-05-15',
          accruedInterest: 23.4,
        },
        currentPrice: 88.3,
        currentValue: 267_030,
        ytm: 9.82,
        daysToMaturity: 5449,
        unrealizedPnlPercent: -8.5,
        portfolioWeight: 9.29,
      },
    ],
    cashRows: [
      {
        balance: { accountId: '1', currency: 'RUB', amount: 115_973 },
        rubEquivalent: 115_973,
        accountWeight: 6.03,
      },
    ],
  },
  {
    id: '2',
    name: 'Т-Банк Инвестиции',
    broker: 'Т-Банк',
    totalValue: 950_840,
    unrealizedPnl: 94_200,
    portfolioWeight: 33.08,
    equityRows: [
      {
        position: {
          id: 'p4', accountId: '2', ticker: 'GAZP', name: 'Газпром', exchange: 'MOEX',
          currency: 'RUB', quantity: 1000, averagePrice: 178.3, averagingMethod: 'WAVG',
          assetType: 'equity',
        },
        currentPrice: 156.4,
        currentValue: 156_400,
        unrealizedPnl: -21_900,
        unrealizedPnlPercent: -12.28,
        portfolioWeight: 5.44,
      },
    ],
    bondRows: [],
    cashRows: [],
  },
]

export function usePortfolio(): UsePortfolioResult {
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [accounts, setAccounts] = useState<AccountSummary[]>([])

  useEffect(() => {
    // TODO: заменить на реальный API-вызов когда будут эндпоинты
    const timer = setTimeout(() => {
      setSummary(MOCK_SUMMARY)
      setAccounts(MOCK_ACCOUNTS)
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  return { summary, accounts, isLoading, error }
}
