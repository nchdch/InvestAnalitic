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

/** Склонение русского существительного по числу: pluralRu(3, ['год', 'года', 'лет']) → "года" */
function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

/** Срок от даты до сегодня в виде «2 года 3 мес.» / «5 мес.» / «12 дн.» */
export function formatDuration(fromIso: string): string {
  const from = new Date(fromIso)
  const now = new Date()
  let months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth())
  if (now.getDate() < from.getDate()) months -= 1

  if (months < 1) {
    const days = Math.max(0, Math.round((now.getTime() - from.getTime()) / 86_400_000))
    return `${days} ${pluralRu(days, ['день', 'дня', 'дней'])}`
  }

  const years = Math.floor(months / 12)
  const restMonths = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ${pluralRu(years, ['год', 'года', 'лет'])}`)
  if (restMonths > 0) parts.push(`${restMonths} ${pluralRu(restMonths, ['месяц', 'месяца', 'месяцев'])}`)
  return parts.join(' ')
}
