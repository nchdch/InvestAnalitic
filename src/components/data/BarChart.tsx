import { injectOnce } from '../_internal/style'

const CSS = `
.ia-barchart{ display:flex; flex-direction:column; gap:6px; }
.ia-barchart__svg{ display:block; width:100%; overflow:visible; }
.ia-barchart__axis{ display:flex; font-size:var(--text-2xs); color:var(--text-4); }
.ia-barchart__axis span{ flex:1; text-align:center; }
.ia-barchart--empty{ display:flex; align-items:center; justify-content:center; height:160px; color:var(--text-4); font-size:var(--text-sm); }
`

export interface BarChartSegment {
  value: number
  color: string
}

export interface BarChartPoint {
  label: string
  segments: BarChartSegment[]
}

export interface BarChartProps {
  data: BarChartPoint[]
  height?: number
}

export function BarChart({ data, height = 160 }: BarChartProps) {
  injectOnce('ia-barchart', CSS)

  const totals = data.map((d) => d.segments.reduce((s, seg) => s + seg.value, 0))
  const max = Math.max(...totals, 0)

  if (data.length === 0 || max <= 0) {
    return <div className="ia-barchart--empty">Недостаточно данных для графика</div>
  }

  const width = 600
  const gap = 6
  const barWidth = Math.max(width / data.length - gap, 1)
  const padTop = 6

  return (
    <div className="ia-barchart">
      <svg className="ia-barchart__svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const x = i * (barWidth + gap) + gap / 2
          let yOffset = height
          return (
            <g key={i}>
              {d.segments.map((seg, j) => {
                if (seg.value <= 0) return null
                const h = (seg.value / max) * (height - padTop)
                yOffset -= h
                return (
                  <rect key={j} x={x} y={yOffset} width={barWidth} height={h} fill={seg.color} rx={2} />
                )
              })}
              <title>{`${d.label}: ${totals[i].toFixed(2)}`}</title>
            </g>
          )
        })}
      </svg>
      <div className="ia-barchart__axis">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  )
}
