import React from 'react'
import { injectOnce } from '../_internal/style'

const CSS = `
.ia-sparkline{ display:block; overflow:visible; }
.ia-sparkline--empty{ color:var(--text-4); font-size:var(--text-xs); }
`

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
}

export function Sparkline({ data, width = 96, height = 32 }: SparklineProps) {
  injectOnce('ia-sparkline', CSS)

  if (data.length < 2) {
    return <span className="ia-sparkline--empty">—</span>
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const pad = 2

  const points = data
    .map((v, i) => {
      const x = i * step
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const isUp = data[data.length - 1] >= data[0]
  const color = isUp ? 'var(--positive)' : 'var(--negative)'

  return (
    <svg
      className="ia-sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
