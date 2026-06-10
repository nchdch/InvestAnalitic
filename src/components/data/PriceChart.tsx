import React, { useEffect, useId, useRef, useState } from 'react'
import { injectOnce } from '../_internal/style'
import { formatPrice, formatPercent } from '../../utils/format'

const CSS = `
.ia-pricechart{ display:flex; flex-direction:column; gap:6px; }
.ia-pricechart__chart{ position:relative; }
.ia-pricechart__svg{ display:block; width:100%; overflow:visible; touch-action:none; cursor:crosshair; user-select:none; }
.ia-pricechart__axis{ display:flex; justify-content:space-between; font-size:var(--text-2xs); color:var(--text-4); padding:0 2px; }
.ia-pricechart--empty{ display:flex; align-items:center; justify-content:center; height:220px; color:var(--text-4); font-size:var(--text-sm); }

.ia-pricechart__badge{
  position:absolute; top:6px; left:6px; z-index:1;
  display:flex; align-items:center; gap:5px;
  padding:3px 9px; border-radius:var(--radius-pill);
  background:var(--surface-sunken); border:1px solid var(--border-1);
  font-size:var(--text-2xs); font-weight:var(--fw-medium); color:var(--text-3);
  pointer-events:none;
}
.ia-pricechart__badge b{ font-family:var(--font-mono); font-weight:var(--fw-semibold); }
.ia-pricechart__badge.is-up b{ color:var(--positive); }
.ia-pricechart__badge.is-down b{ color:var(--negative); }

.ia-pricechart__reset{
  position:absolute; top:6px; right:6px; z-index:1;
  padding:3px 10px; border-radius:var(--radius-pill); border:1px solid var(--border-1);
  background:var(--surface-sunken); color:var(--text-3);
  font-size:var(--text-2xs); font-weight:var(--fw-medium); cursor:pointer;
  transition: color .15s var(--ease-out), border-color .15s var(--ease-out);
}
.ia-pricechart__reset:hover{ color:var(--text-1); border-color:var(--border-2); }
`

export interface PriceChartProps {
  dates: string[]
  prices: number[]
  height?: number
  /** Валюта для подписи цены сбоку графика (по умолчанию рубли). */
  currency?: string
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function fmtAxisDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

function fmtTooltipDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

type PointerEvt = React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>

export function PriceChart({ dates, prices, height = 220, currency = 'RUB' }: PriceChartProps) {
  injectOnce('ia-pricechart', CSS)

  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const svgRef = useRef<SVGSVGElement>(null)

  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragX, setDragX] = useState<number | null>(null)

  // Сбрасываем масштаб при смене набора данных (например, при переключении диапазона дат)
  const dataKey = `${dates[0] ?? ''}|${dates[dates.length - 1] ?? ''}|${dates.length}`
  useEffect(() => { setZoomDomain(null) }, [dataKey])

  if (prices.length < 2) {
    return <div className="ia-pricechart--empty">Недостаточно данных для графика</div>
  }

  const [zStart, zEnd] = zoomDomain ?? [0, prices.length - 1]
  const visiblePrices = prices.slice(zStart, zEnd + 1)
  const visibleDates = dates.slice(zStart, zEnd + 1)

  const width = 600
  const AXIS_W = 64
  const plotW = width - AXIS_W
  const padTop = 16
  const padBottom = 8
  const chartH = height - padTop - padBottom

  const min = Math.min(...visiblePrices)
  const max = Math.max(...visiblePrices)
  const range = max - min
  const padRange = (range || max || 1) * 0.12
  const scaleMin = min - padRange
  const scaleRange = range + padRange * 2 || 1

  const y = (v: number) => padTop + (1 - (v - scaleMin) / scaleRange) * chartH
  const step = plotW / (visiblePrices.length - 1)

  const linePoints = visiblePrices
    .map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`)
    .join(' ')
  const areaBaseline = (padTop + chartH).toFixed(2)
  const areaPoints = `0,${areaBaseline} ${linePoints} ${plotW.toFixed(2)},${areaBaseline}`

  const isUp = visiblePrices[visiblePrices.length - 1] >= visiblePrices[0]
  const color = isUp ? 'var(--positive)' : 'var(--negative)'
  const gradientId = `ia-pricechart-grad-${uid}`

  const labelCount = Math.min(6, visibleDates.length)
  const labelIdxs = Array.from({ length: labelCount }, (_, i) =>
    Math.round((i * (visibleDates.length - 1)) / (labelCount - 1))
  )

  const gridValues = range > 0 ? [max, (max + min) / 2, min] : [max]

  const lastIdx = visiblePrices.length - 1
  const lastPrice = visiblePrices[lastIdx]
  const lastY = y(lastPrice)

  let maxIdx = 0
  let minIdx = 0
  visiblePrices.forEach((v, i) => {
    if (v > visiblePrices[maxIdx]) maxIdx = i
    if (v < visiblePrices[minIdx]) minIdx = i
  })

  const periodChange = visiblePrices[0] !== 0
    ? ((lastPrice - visiblePrices[0]) / visiblePrices[0]) * 100
    : 0

  function clientXToPlotX(clientX: number): number {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(plotW, ratio * width))
  }

  function indexFromX(x: number): number {
    return Math.max(0, Math.min(visiblePrices.length - 1, Math.round(x / step)))
  }

  function getClientX(e: PointerEvt): number {
    return 'touches' in e ? (e.touches[0] ?? e.changedTouches[0]).clientX : e.clientX
  }

  function handleMove(e: PointerEvt) {
    const x = clientXToPlotX(getClientX(e))
    setHoverIndex(indexFromX(x))
    if (dragStart != null) setDragX(x)
  }

  function handleDown(e: PointerEvt) {
    const x = clientXToPlotX(getClientX(e))
    setDragStart(x)
    setDragX(x)
  }

  function handleUp() {
    if (dragStart != null && dragX != null && Math.abs(dragX - dragStart) > 14) {
      const i0 = indexFromX(Math.min(dragStart, dragX))
      const i1 = indexFromX(Math.max(dragStart, dragX))
      if (i1 > i0) {
        const base = zoomDomain ? zoomDomain[0] : 0
        setZoomDomain([base + i0, base + i1])
      }
    }
    setDragStart(null)
    setDragX(null)
  }

  function handleLeave() {
    setHoverIndex(null)
    setDragStart(null)
    setDragX(null)
  }

  const showCrosshair = hoverIndex != null && dragStart == null
  const hoverX = hoverIndex != null ? hoverIndex * step : 0
  const hoverY = hoverIndex != null ? y(visiblePrices[hoverIndex]) : 0
  const tooltipW = 96
  const tooltipH = 34
  const tooltipX = Math.max(0, Math.min(plotW - tooltipW, hoverX - tooltipW / 2))

  return (
    <div className="ia-pricechart">
      <div className="ia-pricechart__chart">
        <div className={'ia-pricechart__badge' + (periodChange >= 0 ? ' is-up' : ' is-down')}>
          За период <b>{formatPercent(periodChange)}</b>
        </div>
        {zoomDomain && (
          <button type="button" className="ia-pricechart__reset" onClick={() => setZoomDomain(null)}>
            Сбросить масштаб
          </button>
        )}
        <svg
          ref={svgRef}
          className="ia-pricechart__svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseMove={handleMove}
          onMouseDown={handleDown}
          onMouseUp={handleUp}
          onMouseLeave={handleLeave}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
          onDoubleClick={() => setZoomDomain(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((v, i) => (
            <line key={`grid-${i}`} x1="0" y1={y(v)} x2={plotW} y2={y(v)} stroke="var(--border-1)" strokeWidth="1" strokeDasharray="2 4" />
          ))}

          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
          <polyline
            points={linePoints}
            fill="none"
            stroke={color}
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* текущая цена — линия-ориентир и подпись сбоку */}
          <line x1="0" y1={lastY} x2={plotW} y2={lastY} stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
          <rect x={plotW + 2} y={lastY - 8} width={AXIS_W - 4} height="16" rx="3" fill="var(--surface-raised)" stroke={color} strokeOpacity="0.5" />
          <text x={width - 4} y={lastY + 3.5} fontSize="10" fontFamily="var(--font-mono)" fill={color} textAnchor="end">
            {formatPrice(lastPrice, currency)}
          </text>

          {gridValues
            .filter((v) => Math.abs(y(v) - lastY) > 10)
            .map((v, i) => (
              <text key={`axis-${i}`} x={width - 4} y={y(v) + 3} fontSize="9" fill="var(--text-4)" textAnchor="end">
                {formatPrice(v, currency)}
              </text>
            ))}

          {range > 0 && (
            <>
              <circle cx={maxIdx * step} cy={y(visiblePrices[maxIdx])} r="2.5" fill="var(--text-4)" />
              <text
                x={maxIdx * step}
                y={y(visiblePrices[maxIdx]) - 6}
                fontSize="9" fill="var(--text-4)"
                textAnchor={maxIdx * step < 30 ? 'start' : maxIdx * step > plotW - 30 ? 'end' : 'middle'}
              >
                {formatPrice(visiblePrices[maxIdx], currency)}
              </text>
              <circle cx={minIdx * step} cy={y(visiblePrices[minIdx])} r="2.5" fill="var(--text-4)" />
              <text
                x={minIdx * step}
                y={y(visiblePrices[minIdx]) + 13}
                fontSize="9" fill="var(--text-4)"
                textAnchor={minIdx * step < 30 ? 'start' : minIdx * step > plotW - 30 ? 'end' : 'middle'}
              >
                {formatPrice(visiblePrices[minIdx], currency)}
              </text>
            </>
          )}

          {dragStart != null && dragX != null && Math.abs(dragX - dragStart) > 2 && (
            <rect
              x={Math.min(dragStart, dragX)}
              y={padTop}
              width={Math.abs(dragX - dragStart)}
              height={chartH}
              fill="var(--azure-500)"
              opacity="0.12"
            />
          )}

          {showCrosshair && (
            <>
              <line x1={hoverX} y1={padTop} x2={hoverX} y2={padTop + chartH} stroke="var(--border-2)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={hoverX} cy={hoverY} r="3.5" fill={color} stroke="var(--surface-card)" strokeWidth="1.5" />
              <g>
                <rect x={tooltipX} y="2" width={tooltipW} height={tooltipH} rx="4" fill="var(--surface-raised)" stroke="var(--border-1)" />
                <text x={tooltipX + 8} y="15" fontSize="9" fill="var(--text-4)">{fmtTooltipDate(visibleDates[hoverIndex as number])}</text>
                <text x={tooltipX + 8} y="28" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600" fill="var(--text-1)">
                  {formatPrice(visiblePrices[hoverIndex as number], currency)}
                </text>
              </g>
            </>
          )}
        </svg>
      </div>
      <div className="ia-pricechart__axis">
        {labelIdxs.map((idx) => <span key={idx}>{fmtAxisDate(visibleDates[idx])}</span>)}
      </div>
    </div>
  )
}
