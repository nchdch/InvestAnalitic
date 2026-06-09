/**
 * Directional profit/loss figure — the signature data primitive of InvestAnalitic.
 * Renders the value with the correct sign (true minus −), P&L color (emerald up /
 * red down / slate flat), an optional up/down arrow and tabular mono figures so
 * columns align. Formats to the house money/percent style automatically
 * (1 234,56 ₽ · +12,34%).
 *
 * Pass a positive/negative number; the component derives direction. For a row
 * that shows both rouble and percent change, pass `value` AND `percent` with
 * `display="both"`.
 */
export interface PnLValueProps {
  /** Rouble amount (signed). Drives direction unless `percent` is given. */
  value?: number
  /** Percentage change (signed). When set, drives direction. */
  percent?: number | null
  /** What to render. @default "both" */
  display?: 'money' | 'percent' | 'both'
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Show the directional arrow glyph. @default true */
  arrow?: boolean
  /** Render as a tinted pill badge. */
  badge?: boolean
  /** Show arrow/sign even when the value is exactly zero. */
  showSignWhenZero?: boolean
  className?: string
}

export declare function PnLValue(props: PnLValueProps): JSX.Element
