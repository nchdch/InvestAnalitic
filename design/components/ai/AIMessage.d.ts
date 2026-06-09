import { ReactNode } from 'react'

/**
 * A single chat turn in the AI analyst conversation — the centrepiece of the
 * product. The AI turn renders a gradient "spark" avatar, a violet-tinted bubble
 * (`--surface-ai`) and an optional row of action chips (e.g. "Показать варианты
 * ребалансировки"). The user turn is an azure, right-aligned bubble. Set
 * `typing` for the animated three-dot indicator while a response streams.
 *
 * Write the AI's copy in the house voice: informal "ты", concrete figures from
 * the portfolio, a short read, then a CTA. Lead proactive messages with one
 * signal emoji (📅 ⚖️ 🧾 ⚠️ 📌).
 */
export interface AIMessageProps {
  /** @default "ai" */
  role?: 'ai' | 'user'
  /** Display name override (default "ИИ-аналитик" / "Вы"). */
  name?: string
  /** Show the typing indicator instead of children. */
  typing?: boolean
  /** Action chips under the bubble — typically <Button variant="soft" size="sm">. */
  actions?: ReactNode
  /** Message content (can include <p>, <strong>, PnLValue, etc.). */
  children?: ReactNode
  className?: string
}

export declare function AIMessage(props: AIMessageProps): JSX.Element
