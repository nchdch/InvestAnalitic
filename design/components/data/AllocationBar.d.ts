export interface AllocationSegment {
  label: string
  /** Raw weight; segments are summed and normalised to %. */
  value: number
  /** Override the auto-assigned palette colour (any CSS colour / token). */
  color?: string
}

/**
 * Horizontal stacked allocation bar with legend — the system's primary "chart".
 * Use for portfolio composition (акции/облигации/деньги), sector breakdown, or
 * per-account weights. Values are normalised, so pass raw rouble amounts or
 * percentages. Colours auto-assign from a data palette (azure-led, P&L hues
 * avoided so weights aren't misread as gains/losses).
 */
export interface AllocationBarProps {
  segments: AllocationSegment[]
  /** @default "md" */
  size?: 'md' | 'lg'
  /** Show the labelled legend below the bar. @default true */
  showLegend?: boolean
  className?: string
}

export declare function AllocationBar(props: AllocationBarProps): JSX.Element
