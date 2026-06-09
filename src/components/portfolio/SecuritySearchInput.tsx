import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader } from 'lucide-react'
import { injectOnce } from '../_internal/style'
import { searchSecurities } from '../../api/client'
import type { SecuritySearchResult } from '../../api/client'

const CSS = `
.ia-sec-wrap {
  position: relative;
}
.ia-sec-field {
  position: relative;
  display: flex;
  align-items: center;
}
.ia-sec-icon {
  position: absolute;
  left: 10px;
  color: var(--text-3);
  pointer-events: none;
  flex-shrink: 0;
}
.ia-sec-input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  border: 1px solid var(--border-1);
  border-radius: var(--radius-md);
  background: var(--surface-input);
  color: var(--text-1);
  font-size: var(--text-sm);
  font-family: inherit;
  outline: none;
  transition: border-color var(--dur-fast) var(--ease-out);
  box-sizing: border-box;
}
.ia-sec-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.ia-sec-input::placeholder { color: var(--text-4); }
.ia-sec-input.has-value { font-family: var(--font-mono); font-size: var(--text-sm); font-weight: var(--fw-semibold); }
.ia-sec-spinner {
  position: absolute;
  right: 10px;
  color: var(--text-3);
  animation: ia-spin 0.7s linear infinite;
}
@keyframes ia-spin { to { transform: rotate(360deg); } }
.ia-sec-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 2000;
  background: var(--surface-card);
  border: 1px solid var(--border-1);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
}
.ia-sec-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  cursor: pointer;
  transition: background var(--dur-fast);
}
.ia-sec-item:hover,
.ia-sec-item.is-active { background: var(--surface-sunken); }
.ia-sec-badge {
  flex-shrink: 0;
  width: 44px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--fw-bold);
  letter-spacing: 0.02em;
  text-align: center;
  line-height: 1;
  padding: 0 2px;
  overflow: hidden;
  word-break: break-all;
}
.ia-sec-badge.eq { background: var(--accent-soft); color: var(--accent-hover); }
.ia-sec-badge.bond { background: var(--surface-sunken); color: var(--text-2); border: 1px solid var(--border-1); }
.ia-sec-info { flex: 1; min-width: 0; }
.ia-sec-name { font-size: var(--text-sm); font-weight: var(--fw-medium); color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ia-sec-sub { font-size: var(--text-xs); color: var(--text-3); margin-top: 1px; }
.ia-sec-right { flex-shrink: 0; text-align: right; }
.ia-sec-type { font-size: var(--text-xs); color: var(--text-3); }
.ia-sec-exch { font-size: 10px; color: var(--text-4); margin-top: 1px; }
.ia-sec-empty { padding: 14px 16px; font-size: var(--text-sm); color: var(--text-3); text-align: center; }
.ia-sec-label { font-size: var(--text-xs); font-weight: var(--fw-semibold); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-3); margin-bottom: 6px; display: block; }
`

interface Props {
  onSelect: (s: SecuritySearchResult) => void
  selectedTicker?: string
}

export function SecuritySearchInput({ onSelect, selectedTicker }: Props) {
  injectOnce('ia-sec-search', CSS)

  const [query, setQuery] = useState(selectedTicker ?? '')
  const [results, setResults] = useState<SecuritySearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [selected, setSelected] = useState<SecuritySearchResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external ticker prop
  useEffect(() => {
    if (selectedTicker !== undefined && selectedTicker !== query) {
      setQuery(selectedTicker)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicker])

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchSecurities(q)
        setResults(data)
        setOpen(data.length > 0)
        setHighlighted(0)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const handleChange = (val: string) => {
    setQuery(val)
    setSelected(null)
    doSearch(val)
  }

  const handleSelect = (s: SecuritySearchResult) => {
    setSelected(s)
    setQuery(s.ticker)
    setOpen(false)
    onSelect(s)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[highlighted]) handleSelect(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasValue = !!selected

  return (
    <div ref={containerRef} className="ia-sec-wrap">
      <label className="ia-sec-label">Код или название бумаги</label>
      <div className="ia-sec-field">
        <Search size={14} className="ia-sec-icon" />
        <input
          ref={inputRef}
          className={`ia-sec-input${hasValue ? ' has-value' : ''}`}
          placeholder="SBER, Сбербанк, ОФЗ..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <Loader size={14} className="ia-sec-spinner" />}
      </div>

      {open && (
        <div className="ia-sec-dropdown">
          {results.length === 0 ? (
            <div className="ia-sec-empty">Ничего не найдено</div>
          ) : (
            results.map((s, i) => (
              <div
                key={s.ticker + i}
                className={`ia-sec-item${i === highlighted ? ' is-active' : ''}`}
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              >
                <div className={`ia-sec-badge ${s.assetType === 'equity' ? 'eq' : 'bond'}`}>
                  {s.ticker.length > 6 ? s.ticker.slice(0, 6) : s.ticker}
                </div>
                <div className="ia-sec-info">
                  <div className="ia-sec-name">{s.shortName}</div>
                  {s.isin && <div className="ia-sec-sub">{s.isin}</div>}
                </div>
                <div className="ia-sec-right">
                  <div className="ia-sec-type">{s.assetType === 'equity' ? 'Акция' : 'Облигация'}</div>
                  <div className="ia-sec-exch">{s.exchange} · {s.currency}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
