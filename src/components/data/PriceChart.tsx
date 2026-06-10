import { injectOnce } from '../_internal/style'

const CSS = `
.ia-pricechart{ display:flex; flex-direction:column; gap:6px; }
.ia-pricechart__svg{ display:block; width:100%; overflow:visible; }
.ia-pricechart__axis{ display:flex; justify-content:space-between; font-size:var(--text-2xs); color:var(--text-4); padding:0 2px; }
.ia-pricechart--empty{ display:flex; align-items:center; justify-content:center; height:220px; color:var(--text-4); font-size:var(--text-sm); }
`

export interface PriceChartProps {
  dates: string[]
  prices: number[]
  height?: number
}

function fmtAxisDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

export function PriceChart({ dates, prices, height = 220 }: PriceChartProps) {
  injectOnce('ia-pricechart', CSS)

  if (prices.length < 2) {
    return <div className="ia-pricechart--empty">Недостаточно данных для графика</div>
  }

  const width = 600
  const padTop = 10
  const padBottom = 4
  const chartH = height - padTop - padBottom
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const step = width / (prices.length - 1)

  const linePoints = prices
    .map((v, i) => {
      const x = i * step
      const y = padTop + (1 - (v - min) / range) * chartH
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const areaPoints = `0,${padTop + chartH} ${linePoints} ${width},${padTop + chartH}`

  const isUp = prices[prices.length - 1] >= prices[0]
  const color = isUp ? 'var(--positive)' : 'var(--negative)'

  const labelCount = Math.min(6, dates.length)
  const labelIdxs = Array.from({ length: labelCount }, (_, i) =>
    Math.round((i * (dates.length - 1)) / (labelCount - 1))
  )

  return (
    <div className="ia-pricechart">
      <svg className="ia-pricechart__svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polygon points={areaPoints} fill={color} opacity={0.08} />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="ia-pricechart__axis">
        {labelIdxs.map((idx) => <span key={idx}>{fmtAxisDate(dates[idx])}</span>)}
      </div>
    </div>
  )
}
