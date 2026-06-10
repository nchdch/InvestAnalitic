import { injectOnce } from '../_internal/style'

const CSS = `
.ia-donut{ display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
.ia-donut__svg{ flex:none; }
.ia-donut__legend{ display:flex; flex-direction:column; gap:8px; flex:1; min-width:160px; }
.ia-donut__row{ display:flex; align-items:center; gap:8px; font-size:var(--text-sm); color:var(--text-2); }
.ia-donut__swatch{ width:10px; height:10px; border-radius:3px; flex:none; }
.ia-donut__label{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:var(--font-mono); }
.ia-donut__value{ color:var(--text-1); font-weight:var(--fw-semibold); font-family:var(--font-mono); font-variant-numeric:tabular-nums lining-nums; white-space:nowrap; }
.ia-donut--empty{ display:flex; align-items:center; justify-content:center; height:160px; color:var(--text-4); font-size:var(--text-sm); }
`

export interface DonutChartSlice {
  label: string
  value: number
  weight: number
  color: string
}

export interface DonutChartProps {
  data: DonutChartSlice[]
  size?: number
  thickness?: number
}

export function DonutChart({ data, size = 160, thickness = 24 }: DonutChartProps) {
  injectOnce('ia-donut', CSS)

  const total = data.reduce((s, d) => s + d.value, 0)
  if (data.length === 0 || total <= 0) {
    return <div className="ia-donut--empty">Недостаточно данных для графика</div>
  }

  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="ia-donut">
      <svg className="ia-donut__svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const dash = (d.value / total) * circumference
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return el
          })}
        </g>
      </svg>
      <div className="ia-donut__legend">
        {data.map((d, i) => (
          <div className="ia-donut__row" key={i}>
            <span className="ia-donut__swatch" style={{ background: d.color }} />
            <span className="ia-donut__label">{d.label}</span>
            <span className="ia-donut__value">{d.weight.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
