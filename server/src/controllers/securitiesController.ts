import type { Request, Response } from 'express'
import { fetchRubRate } from '../services/fxService.js'
import { fetchPriceHistory } from '../services/marketHistoryService.js'
import { fetchMoexPrice } from '../services/moexService.js'

interface MoexResponse {
  securities: {
    columns: string[]
    data: unknown[][]
  }
}

export interface SecurityResult {
  ticker: string
  shortName: string
  fullName: string
  isin: string | null
  assetType: 'equity' | 'bond' | null
  currency: 'RUB' | 'USD' | 'EUR'
  exchange: string
  isTraded: boolean
}

function detectAssetType(group: string): 'equity' | 'bond' | null {
  if (!group) return null
  if (group.startsWith('stock_shares') || group.startsWith('stock_preferred') || group.startsWith('stock_dr')) return 'equity'
  if (group.startsWith('bond_') || group === 'stock_bonds') return 'bond'
  if (group.startsWith('stock_etf') || group.startsWith('stock_ppif')) return 'equity'
  return null
}

function detectCurrency(board: string): 'RUB' | 'USD' | 'EUR' {
  if (!board) return 'RUB'
  if (board.startsWith('SPBX') || board.startsWith('SPBM') || board === 'FQBR') return 'USD'
  return 'RUB'
}

function detectExchange(board: string): string {
  if (!board) return 'MOEX'
  if (board.startsWith('SPBX') || board.startsWith('SPBM')) return 'SPB'
  return 'MOEX'
}

export async function rate(req: Request, res: Response): Promise<void> {
  const currency = (req.query.currency as string | undefined)?.toUpperCase() ?? 'RUB'

  try {
    const result = await fetchRubRate(currency)
    if (!result) {
      res.status(404).json({ error: `Курс ${currency} не найден` })
      return
    }
    res.json({ currency, rate: result.rate, date: result.date })
  } catch (err) {
    console.error('exchange rate error:', err)
    res.status(502).json({ error: 'Ошибка получения курса валют' })
  }
}

export async function price(req: Request, res: Response): Promise<void> {
  const ticker = (req.query.ticker as string | undefined)?.trim().toUpperCase()
  const assetType = (req.query.assetType as string | undefined) === 'bond' ? 'bond' : 'equity'

  if (!ticker) {
    res.status(400).json({ error: 'ticker is required' })
    return
  }

  try {
    const value = await fetchMoexPrice(ticker, assetType)
    if (value == null) {
      res.status(404).json({ error: `Цена ${ticker} не найдена` })
      return
    }
    res.json({ ticker, price: value })
  } catch (err) {
    console.error('security price error:', err)
    res.status(502).json({ error: 'Ошибка получения цены инструмента' })
  }
}

export async function history(req: Request, res: Response): Promise<void> {
  const ticker = (req.query.ticker as string | undefined)?.trim().toUpperCase()
  const assetType = (req.query.assetType as string | undefined) === 'bond' ? 'bond' : 'equity'

  if (!ticker) {
    res.status(400).json({ error: 'ticker is required' })
    return
  }

  try {
    const prices = await fetchPriceHistory(ticker, assetType)
    res.json({ ticker, prices })
  } catch (err) {
    console.error('price history error:', err)
    res.status(502).json({ error: 'Ошибка получения истории цен' })
  }
}

export async function search(req: Request, res: Response): Promise<void> {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q || q.length < 2) {
    res.json([])
    return
  }

  try {
    const url = `https://iss.moex.com/iss/securities.json?q=${encodeURIComponent(q)}&limit=20&iss.meta=off&is_trading=1`
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'InvestAnalitic/1.0' },
      signal: AbortSignal.timeout(5000),
    })

    if (!upstream.ok) {
      res.status(502).json({ error: 'Ошибка загрузки данных MOEX' })
      return
    }

    const body = (await upstream.json()) as MoexResponse
    const cols = body.securities?.columns ?? []
    const data = body.securities?.data ?? []

    const idx = (name: string) => cols.indexOf(name)
    const iTicker = idx('secid')
    const iShort  = idx('shortname')
    const iName   = idx('name')
    const iIsin   = idx('isin')
    const iTraded = idx('is_traded')
    const iGroup  = idx('group')
    const iBoard  = idx('primary_boardid')

    const results: SecurityResult[] = data
      .filter((row) => (row[iTraded] as number) === 1)
      .map((row): SecurityResult => {
        const ticker = String(row[iTicker] ?? '')
        const group  = String(row[iGroup]  ?? '')
        const board  = String(row[iBoard]  ?? '')
        return {
          ticker,
          shortName: String(row[iShort] ?? ticker),
          fullName:  String(row[iName]  ?? ticker),
          isin:      row[iIsin] ? String(row[iIsin]) : null,
          assetType: detectAssetType(group),
          currency:  detectCurrency(board),
          exchange:  detectExchange(board),
          isTraded:  true,
        }
      })
      .filter((r) => r.ticker && r.assetType !== null)
      .slice(0, 12)

    res.json(results)
  } catch (err) {
    console.error('securities search error:', err)
    res.status(502).json({ error: 'Ошибка поиска инструментов' })
  }
}
