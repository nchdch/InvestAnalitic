import { ReactNode, ButtonHTMLAttributes } from 'react'

/**
 * Square, icon-only button for toolbars, table-row actions and close affordances.
 * Always pass `label` for accessibility (used as aria-label + tooltip).
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg'
  /** @default "ghost" */
  variant?: 'ghost' | 'outlined' | 'solid'
  /** Accessible label + native tooltip. Required. */
  label: string
  /** The icon node (e.g. <i data-lucide="bell" />). */
  children?: ReactNode
}

export declare function IconButton(props: IconButtonProps): JSX.Element
