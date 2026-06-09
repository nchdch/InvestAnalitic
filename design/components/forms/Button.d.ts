import { ReactNode, ButtonHTMLAttributes } from 'react'

/**
 * Primary action control for InvestAnalitic. Built entirely on design-system
 * tokens; ships its own styling. Use `primary` for the single main action per
 * view, `secondary` for adjacent actions, `ghost` for low-emphasis/toolbar,
 * `soft` for tinted secondary, `danger` for destructive (e.g. удалить счёт).
 *
 * @startingPoint section="Forms" subtitle="Buttons — all variants & sizes" viewport="700x150"
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger'
  /** Control height. @default "md" */
  size?: 'sm' | 'md' | 'lg'
  /** Stretch to full container width. */
  block?: boolean
  /** Show a spinner and block interaction. */
  loading?: boolean
  disabled?: boolean
  /** Icon node rendered before the label (e.g. a Lucide <i data-lucide>). */
  leftIcon?: ReactNode
  /** Icon node rendered after the label. */
  rightIcon?: ReactNode
  /** Render as a different element, e.g. "a" for a link button. @default "button" */
  as?: 'button' | 'a'
  children?: ReactNode
}

export declare function Button(props: ButtonProps): JSX.Element
