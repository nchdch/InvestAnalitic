import type { Account, Position, Trade, Payment, AccountSummary, CashBalance } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useOrgStore } from '@/store/orgStore'

function activeOrgId(): string | undefined {
  return useOrgStore.getState().activeOrg?.id
}

export interface HealthStatus {
  status: 'ok' | 'degraded'
  db: 'connected' | 'unavailable'
  timestamp: string
}

export interface PortfolioResponse {
  totalValue: number
  equityValue: number
  bondValue: number
  cashValue: number
  equityWeight: number
  bondWeight: number
  cashWeight: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  forwardDividendYield: number | null
  baseCurrency: string
  accounts: AccountSummary[]
}

function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    credentials: 'include',
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `API ${path} responded with ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// Health
export function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/health')
}

// Accounts
export function getAccounts(): Promise<Account[]> {
  const orgId = activeOrgId()
  const q = orgId ? `?orgId=${orgId}` : ''
  return request<Account[]>(`/accounts${q}`)
}
export function createAccount(name: string, broker: string): Promise<Account> {
  return request<Account>('/accounts', { method: 'POST', body: JSON.stringify({ name, broker, orgId: activeOrgId() }) })
}
export function updateAccount(id: string, name: string, broker: string): Promise<Account> {
  return request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify({ name, broker }) })
}
export function deleteAccount(id: string): Promise<void> {
  return request<void>(`/accounts/${id}`, { method: 'DELETE' })
}

// Positions
export function getPositions(accountId?: string): Promise<Position[]> {
  const q = accountId ? `?accountId=${accountId}` : ''
  return request<Position[]>(`/positions${q}`)
}
export function createPosition(data: Omit<Position, 'id'>): Promise<Position> {
  return request<Position>('/positions', { method: 'POST', body: JSON.stringify(data) })
}
export function updatePosition(id: string, patch: Partial<Position> & { lastPrice?: number }): Promise<Position> {
  return request<Position>(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
}
export function deletePosition(id: string): Promise<void> {
  return request<void>(`/positions/${id}`, { method: 'DELETE' })
}

// Trades
export interface CreateTradeInput {
  accountId: string
  ticker: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fee?: number
  currency: string
  executedAt?: string
  exchange?: string
  assetType?: 'equity' | 'bond'
  name?: string
  exchangeRate?: number
}
export function getTrades(accountId?: string, ticker?: string): Promise<Trade[]> {
  const params = new URLSearchParams()
  if (accountId) params.set('accountId', accountId)
  if (ticker) params.set('ticker', ticker)
  const q = params.toString() ? `?${params}` : ''
  return request<Trade[]>(`/trades${q}`)
}
export function createTrade(data: CreateTradeInput): Promise<Trade> {
  return request<Trade>('/trades', { method: 'POST', body: JSON.stringify(data) })
}
export function deleteTrade(id: string): Promise<void> {
  return request<void>(`/trades/${id}`, { method: 'DELETE' })
}

// Payments
export function getPayments(accountId?: string, year?: number): Promise<Payment[]> {
  const params = new URLSearchParams()
  if (accountId) params.set('accountId', accountId)
  if (year) params.set('year', String(year))
  const q = params.toString() ? `?${params}` : ''
  return request<Payment[]>(`/payments${q}`)
}
export function createPayment(data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  return request<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) })
}
export function deletePayment(id: string): Promise<void> {
  return request<void>(`/payments/${id}`, { method: 'DELETE' })
}
export function getPaymentStats(accountId?: string): Promise<{ totalGross: number; totalNet: number; totalTax: number; count: number }> {
  const q = accountId ? `?accountId=${accountId}` : ''
  return request(`/payments/stats${q}`)
}

// Cash balances
export function getCashBalances(accountId: string): Promise<CashBalance[]> {
  return request<CashBalance[]>(`/cash?accountId=${encodeURIComponent(accountId)}`)
}
export function createCashTransaction(data: { accountId: string; currency: string; amount: number }): Promise<CashBalance> {
  return request<CashBalance>('/cash/transactions', { method: 'POST', body: JSON.stringify(data) })
}

// Securities search
export interface SecuritySearchResult {
  ticker: string
  shortName: string
  fullName: string
  isin: string | null
  assetType: 'equity' | 'bond' | null
  currency: 'RUB' | 'USD' | 'EUR'
  exchange: string
  isTraded: boolean
}
export function searchSecurities(q: string): Promise<SecuritySearchResult[]> {
  return request<SecuritySearchResult[]>(`/securities/search?q=${encodeURIComponent(q)}`)
}

export interface ExchangeRateResult {
  currency: string
  rate: number
  date: string
}
export function getExchangeRate(currency: string): Promise<ExchangeRateResult> {
  return request<ExchangeRateResult>(`/securities/rate?currency=${encodeURIComponent(currency)}`)
}

export interface PriceHistoryResult {
  ticker: string
  dates: string[]
  prices: number[]
}
export function getPriceHistory(ticker: string, assetType: 'equity' | 'bond' | 'currency' = 'equity', days?: number): Promise<PriceHistoryResult> {
  const d = days ? `&days=${days}` : ''
  return request<PriceHistoryResult>(`/securities/history?ticker=${encodeURIComponent(ticker)}&assetType=${assetType}${d}`)
}

export interface SecurityPriceResult {
  ticker: string
  price: number
  currency?: 'RUB' | 'USD' | 'EUR'
}
export function getSecurityPrice(ticker: string, assetType: 'equity' | 'bond' = 'equity'): Promise<SecurityPriceResult> {
  return request<SecurityPriceResult>(`/securities/price?ticker=${encodeURIComponent(ticker)}&assetType=${assetType}`)
}

// Portfolio
export function getPortfolioSummary(): Promise<PortfolioResponse> {
  const orgId = activeOrgId()
  const q = orgId ? `?orgId=${orgId}` : ''
  return request<PortfolioResponse>(`/portfolio/summary${q}`)
}

export interface RefreshPricesResult {
  updated: number
  failed: number
  total: number
}
export function refreshPrices(): Promise<RefreshPricesResult> {
  const orgId = activeOrgId()
  const q = orgId ? `?orgId=${orgId}` : ''
  return request<RefreshPricesResult>(`/portfolio/refresh-prices${q}`, { method: 'POST' })
}

