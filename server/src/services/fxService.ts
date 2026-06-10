interface CbrResponse {
  Date: string
  Valute: Record<string, { Value: number; Nominal: number; CharCode: string }>
}

export interface RateResult {
  rate: number
  date: string
}

let cache: { data: CbrResponse; fetchedAt: number } | null = null
const CACHE_TTL_MS = 60 * 60 * 1000

async function loadCbrData(): Promise<CbrResponse> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data

  const upstream = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
    signal: AbortSignal.timeout(5000),
  })
  if (!upstream.ok) throw new Error(`cbr-xml-daily responded with ${upstream.status}`)

  const data = (await upstream.json()) as CbrResponse
  cache = { data, fetchedAt: Date.now() }
  return data
}

/** Курс валюты к рублю (ЦБ РФ, кэш на час). RUB → 1. Возвращает null, если валюта неизвестна ЦБ. */
export async function fetchRubRate(currency: string): Promise<RateResult | null> {
  const cur = currency.toUpperCase()
  if (cur === 'RUB') return { rate: 1, date: new Date().toISOString().slice(0, 10) }

  const data = await loadCbrData()
  const valute = data.Valute[cur]
  if (!valute) return null

  return { rate: Math.round((valute.Value / valute.Nominal) * 10000) / 10000, date: data.Date.slice(0, 10) }
}
