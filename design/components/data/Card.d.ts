import { ReactNode, HTMLAttributes } from 'react'

/**
 * Surface container (panel) with a hairline border and soft shadow — the base
 * for every grouped block: account panels, the summary header, dialogs' bodies.
 * Use `tightBody` when the child is a full-bleed table.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  /** Right-aligned slot in the header (buttons, menu). */
  actions?: ReactNode
  /** @default "sm" */
  elevation?: 'flat' | 'sm' | 'md'
  /** Hover lift + pointer cursor. */
  interactive?: boolean
  /** Remove body padding (for edge-to-edge tables). */
  tightBody?: boolean
  children?: ReactNode
}

export declare function Card(props: CardProps): JSX.Element
