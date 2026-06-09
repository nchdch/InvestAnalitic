import { ReactNode, HTMLAttributes } from 'react'

/**
 * Headline metric block: label + large tabular figure + optional P&L delta and
 * caption. The portfolio total uses `size="xl"`; account and section summaries
 * use `md`/`lg`. Pre-format the `value` string to the house style (the figure is
 * rendered verbatim); pass `delta`/`deltaPercent` as numbers to get a coloured
 * PnLValue under it.
 */
export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  /** Pre-formatted figure, e.g. "2 480 350,00 ₽". */
  value: ReactNode
  /** Small unit appended to the value, e.g. "₽" or "%". */
  unit?: string
  /** Leading label icon (Lucide node). */
  icon?: ReactNode
  /** Signed rouble delta → rendered as a small PnLValue. */
  delta?: number | null
  /** Signed percent delta. */
  deltaPercent?: number | null
  /** Trailing caption, e.g. "за сегодня". */
  caption?: string
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export declare function StatCard(props: StatCardProps): JSX.Element
