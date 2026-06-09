import { ReactNode, InputHTMLAttributes } from 'react'

/**
 * Labelled text/number field with optional prefix/suffix affixes, hint and
 * error state. Set `numeric` for monetary/quantity inputs — switches to the
 * mono family, tabular figures and right alignment (use a `₽`/`%` suffix).
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  label?: string
  required?: boolean
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg'
  /** Leading affix node — an icon or unit (e.g. <i data-lucide="search" />). */
  prefix?: ReactNode
  /** Trailing affix node — typically a unit like ₽ or %. */
  suffix?: ReactNode
  /** Helper text under the field. */
  hint?: string
  /** Error message — turns the field red and replaces the hint. */
  error?: string
  /** Money/quantity mode: mono, tabular, right-aligned. */
  numeric?: boolean
}

export declare function Input(props: InputProps): JSX.Element
