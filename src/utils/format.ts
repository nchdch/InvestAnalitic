/** Форматирование по правилам CLAUDE.md: разделители тысяч и фиксированная точность. */

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

/** Например: 1234567.891 → "1 234 567,89 ₽" */
export function formatRub(amount: number): string {
  return `${rubFormatter.format(amount)} ₽`
}

/** Например: 12.345 → "+12,35%" */
export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`
}

const CURRENCY_SYMBOLS: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€', CNY: '¥', GBP: '£' }

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Например: (208.19, 'USD') → "208,19 $" */
export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  return `${priceFormatter.format(amount)} ${symbol}`
}
