import type { LlmMessage } from './llmService.js'
import type { getPortfolioSummary } from './portfolioService.js'
import { ASSISTANT_SYSTEM_PROMPT } from '../prompts/portfolioAssistantPrompt.js'

type PortfolioSummary = Awaited<ReturnType<typeof getPortfolioSummary>>

const MAX_HISTORY_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 4000

function fmtNum(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${fmtNum(n)}%`
}

/** Текстовый срез портфеля пользователя в формате, описанном в системном промпте (иерархия счёт → акции/облигации/кэш). */
export function buildPortfolioContext(portfolio: PortfolioSummary): string {
  if (portfolio.accounts.length === 0) {
    return 'Портфель пользователя пока пуст — ни одного счёта или позиции не добавлено. Предложи начать с добавления первой сделки или счёта на странице «Портфель».'
  }

  const lines: string[] = []
  lines.push('## Текущее состояние портфеля пользователя')
  lines.push('')
  lines.push(`Базовая валюта: ${portfolio.baseCurrency}`)
  lines.push(`Общая стоимость портфеля: ${fmtNum(portfolio.totalValue)} ₽`)
  lines.push(
    `Распределение: акции ${fmtNum(portfolio.equityWeight)}% (${fmtNum(portfolio.equityValue)} ₽), ` +
      `облигации ${fmtNum(portfolio.bondWeight)}% (${fmtNum(portfolio.bondValue)} ₽), ` +
      `денежные средства ${fmtNum(portfolio.cashWeight)}% (${fmtNum(portfolio.cashValue)} ₽)`,
  )
  lines.push(
    `Совокупный нереализованный P&L: ${fmtNum(portfolio.unrealizedPnl)} ₽ (${fmtPct(portfolio.unrealizedPnlPercent)})`,
  )
  if (portfolio.forwardDividendYield != null) {
    lines.push(`Форвардная дивидендная доходность портфеля: ${fmtPct(portfolio.forwardDividendYield)}`)
  }

  for (const acc of portfolio.accounts) {
    lines.push('')
    lines.push(`### Счёт «${acc.name}» (${acc.broker})`)
    lines.push(
      `Стоимость счёта: ${fmtNum(acc.totalValue)} ₽ (${fmtNum(acc.portfolioWeight)}% портфеля), ` +
        `нереализованный P&L: ${fmtNum(acc.unrealizedPnl)} ₽ (${fmtPct(acc.unrealizedPnlPercent)})`,
    )

    if (acc.equityRows.length > 0) {
      lines.push('')
      lines.push('Акции:')
      lines.push('| Тикер | Название | Кол-во | Средняя цена | Тек. цена | Стоимость ₽ | Доля портфеля | P&L ₽ | P&L % |')
      lines.push('|---|---|---|---|---|---|---|---|---|')
      for (const row of acc.equityRows) {
        lines.push(
          `| ${row.position.ticker} | ${row.position.name} | ${row.position.quantity.toLocaleString('ru-RU')} | ` +
            `${fmtNum(row.position.averagePrice)} ${row.position.currency} | ${fmtNum(row.currentPrice)} ${row.position.currency} | ` +
            `${fmtNum(row.currentValue)} | ${fmtNum(row.portfolioWeight)}% | ${fmtNum(row.unrealizedPnl)} | ${fmtPct(row.unrealizedPnlPercent)} |`,
        )
      }
    }

    if (acc.bondRows.length > 0) {
      lines.push('')
      lines.push('Облигации:')
      lines.push('| Тикер | Название | Кол-во | Номинал | Купон % | Тек. цена | Стоимость ₽ | YTM | До погашения | P&L % |')
      lines.push('|---|---|---|---|---|---|---|---|---|---|')
      for (const row of acc.bondRows) {
        const ytm = row.ytm != null ? fmtPct(row.ytm) : '—'
        const days = row.daysToMaturity != null ? `${row.daysToMaturity} дн.` : '—'
        lines.push(
          `| ${row.position.ticker} | ${row.position.name} | ${row.position.quantity.toLocaleString('ru-RU')} | ` +
            `${fmtNum(row.position.faceValue)} ${row.position.currency} | ${fmtNum(row.position.couponRate)}% | ` +
            `${fmtNum(row.currentPrice)}% | ${fmtNum(row.currentValue)} | ${ytm} | ${days} | ${fmtPct(row.totalPnlPercent)} |`,
        )
      }
    }

    if (acc.cashRows.length > 0) {
      lines.push('')
      lines.push('Денежные средства:')
      lines.push('| Валюта | Сумма | Эквивалент в ₽ | Доля в счёте |')
      lines.push('|---|---|---|---|')
      for (const row of acc.cashRows) {
        lines.push(
          `| ${row.balance.currency} | ${fmtNum(row.balance.amount)} | ${fmtNum(row.rubEquivalent)} | ${fmtNum(row.accountWeight)}% |`,
        )
      }
    }
  }

  return lines.join('\n')
}

export interface AssistantChatInput {
  role: 'user' | 'assistant'
  content: string
}

/** Формирует массив сообщений для LLM: системный промпт + срез портфеля + история диалога. */
export function buildAssistantMessages(portfolio: PortfolioSummary, history: AssistantChatInput[]): LlmMessage[] {
  const trimmedHistory = history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))

  return [
    { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
    { role: 'system', content: buildPortfolioContext(portfolio) },
    ...trimmedHistory,
  ]
}
