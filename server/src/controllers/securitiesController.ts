import type { Request, Response } from 'express'

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
