import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { X, Upload, FileSpreadsheet, CheckCircle2, RotateCcw } from 'lucide-react'
import { Button, Badge } from '../index'
import { injectOnce } from '../_internal/style'
import { getAccounts, createTrade, searchSecurities, getExchangeRate } from '../../api/client'
import type { CreateTradeInput, SecuritySearchResult } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'
import type { Account } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

type FieldKey = 'date' | 'account' | 'ticker' | 'side' | 'quantity' | 'price' | 'fee' | 'currency'

const FIELD_ALIASES: Record<FieldKey, string[]> = {
  date: ['дата', 'дата операции', 'дата сделки', 'date'],
  account: ['счет', 'счёт', 'портфель', 'аккаунт', 'account'],
  ticker: ['тикер', 'инструмент', 'бумага', 'актив', 'ticker', 'symbol'],
  side: ['тип', 'тип операции', 'операция', 'вид операции', 'side', 'type'],
  quantity: ['кол-во', 'количество', 'кол во', 'quantity', 'qty'],
  price: ['цена', 'цена исполнения', 'price'],
  fee: ['комиссия', 'комиссия брокера', 'fee'],
  currency: ['валюта', 'currency'],
}

function normalizeHeader(h: string): string {
  return h.toString().trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ')
}

function buildFieldMap(headers: string[]): Partial<Record<FieldKey, string>> {
  const map: Partial<Record<FieldKey, string>> = {}
  for (const header of headers) {
    const norm = normalizeHeader(header)
    for (const field of Object.keys(FIELD_ALIASES) as FieldKey[]) {
      if (map[field]) continue
      if (FIELD_ALIASES[field].includes(norm)) map[field] = header
    }
  }
  return map
}

function parseDateValue(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString()
  const str = String(value ?? '').trim()
  if (!str) return new Date().toISOString()

  let m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).toISOString()

  m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toISOString()

  const parsed = new Date(str)
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  const str = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.')
  const n = Number(str)
  return Number.isFinite(n) ? n : 0
}

function parseSide(value: unknown): 'buy' | 'sell' | null {
  const str = String(value ?? '').trim().toLowerCase()
  if (str.startsWith('покуп') || str === 'buy' || str === 'b') return 'buy'
  if (str.startsWith('прода') || str === 'sell' || str === 's') return 'sell'
  return null
}

interface ParsedRow {
  rowNum: number
  date: string
  accountName: string
  accountId: string | null
  ticker: string
  name?: string
  assetType: 'equity' | 'bond'
  side: 'buy' | 'sell' | null
  quantity: number
  price: number
  fee: number
  currency: string
  currencyExplicit: boolean
  error: string | null
}

function buildRow(raw: Record<string, unknown>, idx: number, fieldMap: Partial<Record<FieldKey, string>>, accounts: Account[]): ParsedRow {
  const get = (field: FieldKey): unknown => {
    const key = fieldMap[field]
    return key != null ? raw[key] : undefined
  }

  const ticker = String(get('ticker') ?? '').trim().toUpperCase()
  const side = parseSide(get('side'))
  const quantity = parseNumber(get('quantity'))
  const price = parseNumber(get('price'))
  const fee = parseNumber(get('fee'))
  const currencyRaw = String(get('currency') ?? '').trim().toUpperCase()
  const accountNameRaw = String(get('account') ?? '').trim()

  const errors: string[] = []
  if (!ticker) errors.push('не указан тикер')
  if (!side) errors.push('не указан тип операции (покупка/продажа)')
  if (!quantity || quantity <= 0) errors.push('некорректное количество')
  if (!price || price <= 0) errors.push('некорректная цена')

  let accountId: string | null = null
  let accountName = accountNameRaw
  if (accountNameRaw) {
    const found = accounts.find((a) => a.name.trim().toLowerCase() === accountNameRaw.toLowerCase())
    if (found) accountId = found.id
    else errors.push(`портфель «${accountNameRaw}» не найден`)
  } else if (accounts.length === 1) {
    accountId = accounts[0].id
    accountName = accounts[0].name
  } else if (accounts.length > 1) {
    errors.push('не указан портфель, а у вас их несколько')
  } else {
    errors.push('нет ни одного портфеля')
  }

  return {
    rowNum: idx + 2,
    date: parseDateValue(get('date')),
    accountName,
    accountId,
    ticker,
    assetType: 'equity',
    side,
    quantity,
    price,
    fee,
    currency: currencyRaw || 'RUB',
    currencyExplicit: !!currencyRaw,
    error: errors.length > 0 ? errors.join('; ') : null,
  }
}

const fmtNum = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 4 })

interface ImportResult {
  success: number
  failed: number
}

export function ImportModal({ open, onClose }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ratesRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!open) return
    setRows([])
    setError('')
    setResult(null)
    setParsing(false)
    setImporting(false)
    ratesRef.current = new Map()
    getAccounts().then(setAccounts).catch(() => setAccounts([]))
  }, [open])

  const handleFile = useCallback(async (file: File) => {
    setError('')
    setParsing(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const sheetName = wb.SheetNames[0]
      if (!sheetName) throw new Error('В файле нет листов с данными')

      const sheet = wb.Sheets[sheetName]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      if (raw.length === 0) throw new Error('Файл пуст или не содержит строк с данными')

      const fieldMap = buildFieldMap(Object.keys(raw[0]))
      if (!fieldMap.ticker || !fieldMap.side || !fieldMap.quantity || !fieldMap.price) {
        throw new Error('Не удалось определить колонки файла. Нужны как минимум: Тикер, Тип, Количество, Цена')
      }

      const parsed = raw.map((r, i) => buildRow(r, i, fieldMap, accounts))

      // Обогащение по тикерам: тип актива, валюта, название бумаги
      const tickers = [...new Set(parsed.filter((r) => !r.error).map((r) => r.ticker))]
      const found = await Promise.all(
        tickers.map((t) => searchSecurities(t).then((res) => res[0]).catch(() => undefined))
      )
      const enrichMap = new Map<string, SecuritySearchResult | undefined>(tickers.map((t, i) => [t, found[i]]))

      for (const row of parsed) {
        if (row.error) continue
        const match = enrichMap.get(row.ticker)
        if (match) {
          if (match.assetType) row.assetType = match.assetType
          if (!row.currencyExplicit) row.currency = match.currency
          row.name = match.shortName
        }
      }

      // Курсы валют для не-рублёвых сделок (нужны для приведения позиции к рублю)
      const currencies = [...new Set(parsed.filter((r) => !r.error && r.currency !== 'RUB').map((r) => r.currency))]
      for (const cur of currencies) {
        try {
          const r = await getExchangeRate(cur)
          ratesRef.current.set(cur, r.rate)
        } catch {
          // курс не получен — позиция будет учтена по курсу 1, пользователь сможет поправить вручную
        }
      }

      setRows(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [accounts])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleReset = () => {
    setRows([])
    setError('')
    setResult(null)
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')

    let success = 0
    let failed = 0
    const updated = [...rows]

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (row.error || !row.accountId || !row.side) { failed++; continue }
      try {
        const input: CreateTradeInput = {
          accountId: row.accountId,
          ticker: row.ticker,
          name: row.name,
          side: row.side,
          quantity: row.quantity,
          price: row.price,
          fee: row.fee,
          currency: row.currency,
          assetType: row.assetType,
          executedAt: row.date,
          exchangeRate: row.currency !== 'RUB' ? ratesRef.current.get(row.currency) : undefined,
        }
        await createTrade(input)
        success++
      } catch (err) {
        failed++
        updated[i] = { ...row, error: err instanceof Error ? err.message : String(err) }
      }
    }

    setRows(updated)
    setResult({ success, failed })
    setImporting(false)
    if (success > 0) bump()
  }

  if (!open) return null

  const validCount = rows.filter((r) => !r.error).length
  const errorCount = rows.length - validCount

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal ia-modal--wide" role="dialog" aria-modal="true" aria-label="Импорт сделок">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Импорт сделок</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <div className="ia-modal__body">
          {error && <div className="ia-modal-error">{error}</div>}

          {result ? (
            <div className="ia-import-result">
              <CheckCircle2 size={40} />
              <div>
                <div className="ia-import-result__title">Импорт завершён</div>
                <div className="ia-import-result__sub">
                  Успешно добавлено сделок: {result.success} из {rows.length}
                  {result.failed > 0 && `, с ошибками: ${result.failed}`}
                </div>
              </div>
            </div>
          ) : rows.length === 0 ? (
            accounts.length === 0 ? (
              <div className="ia-modal-error">Сначала создайте портфель — добавьте его через меню «Действие»</div>
            ) : (
              <label className="ia-import-drop">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={parsing}
                />
                {parsing ? (
                  <>
                    <FileSpreadsheet size={28} />
                    <span>Обработка файла…</span>
                  </>
                ) : (
                  <>
                    <Upload size={28} />
                    <span>Выберите файл .csv или .xlsx со списком сделок</span>
                    <span className="ia-import-drop__hint">
                      Колонки: Дата, Счёт, Тикер, Тип (покупка/продажа), Кол-во, Цена, Комиссия, Валюта.
                      Названия колонок могут отличаться — попробуем сопоставить автоматически.
                    </span>
                  </>
                )}
              </label>
            )
          ) : (
            <>
              <div className="ia-import-stats">
                <span>Всего строк: <b>{rows.length}</b></span>
                <span>Готово к импорту: <b>{validCount}</b></span>
                {errorCount > 0 && <span>С ошибками: <b>{errorCount}</b></span>}
              </div>

              <div className="ia-import-table-wrap">
                <table className="ia-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Дата</th>
                      <th>Портфель</th>
                      <th>Тикер</th>
                      <th>Тип</th>
                      <th className="r">Кол-во</th>
                      <th className="r">Цена</th>
                      <th className="r">Комиссия</th>
                      <th>Валюта</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={row.error ? 'ia-import-row--error' : ''}>
                        <td>{row.rowNum}</td>
                        <td>{new Date(row.date).toLocaleDateString('ru-RU')}</td>
                        <td>{row.accountName || '—'}</td>
                        <td>{row.ticker}{row.name ? ` · ${row.name}` : ''}</td>
                        <td>{row.side === 'buy' ? 'Покупка' : row.side === 'sell' ? 'Продажа' : '—'}</td>
                        <td className="r">{row.quantity > 0 ? fmtNum(row.quantity) : '—'}</td>
                        <td className="r">{row.price > 0 ? fmtNum(row.price) : '—'}</td>
                        <td className="r">{fmtNum(row.fee)}</td>
                        <td>{row.currency}</td>
                        <td>
                          {row.error ? (
                            <Badge tone="negative" size="sm" title={row.error}>Ошибка</Badge>
                          ) : (
                            <Badge tone="positive" size="sm">ОК</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errorCount > 0 && (
                <div className="ia-modal-error">
                  Строки с ошибками не будут импортированы. Наведите курсор на «Ошибка», чтобы увидеть причину.
                </div>
              )}
            </>
          )}
        </div>

        <div className="ia-modal__foot">
          {result ? (
            <Button type="button" onClick={onClose}>Готово</Button>
          ) : rows.length > 0 ? (
            <>
              <Button type="button" variant="ghost" onClick={handleReset} disabled={importing} leftIcon={<RotateCcw size={15} />}>
                Выбрать другой файл
              </Button>
              <Button type="button" onClick={handleImport} loading={importing} disabled={validCount === 0}>
                Импортировать{validCount > 0 ? ` (${validCount})` : ''}
              </Button>
            </>
          ) : (
            <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          )}
        </div>
      </div>
    </div>
  )
}
