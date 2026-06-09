import { ReactNode, HTMLAttributes } from 'react'

/**
 * Small status pill for labels and states: тип счёта, статус выплаты
 * (предстоит/выплачено), ИИ-метка, риск-флаг. Tone maps to a semantic role.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** @default "neutral" */
  tone?: 'neutral' | 'accent' | 'positive' | 'negative' | 'warning' | 'ai' | 'outline'
  /** @default "md" */
  size?: 'sm' | 'md'
  /** Leading status dot in the current tone colour. */
  dot?: boolean
  /** Leading icon node. */
  icon?: ReactNode
  children?: ReactNode
}

export declare function Badge(props: BadgeProps): JSX.Element
