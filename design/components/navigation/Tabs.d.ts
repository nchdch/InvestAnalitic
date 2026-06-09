import { ReactNode } from 'react'

export interface TabItem {
  value: string
  label: string
  /** Optional count badge, e.g. number of позиций. */
  count?: number
  /** Optional leading icon node. */
  icon?: ReactNode
}

/**
 * Tab bar for switching views — Акции / Облигации / Деньги within an account,
 * or period filters. Controlled via `value` + `onChange`. `line` for primary
 * section nav, `pill` for compact inline segmented control.
 */
export interface TabsProps {
  items: TabItem[]
  value: string
  onChange?: (value: string) => void
  /** @default "line" */
  variant?: 'line' | 'pill'
  className?: string
}

export declare function Tabs(props: TabsProps): JSX.Element
