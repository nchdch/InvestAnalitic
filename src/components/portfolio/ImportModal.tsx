import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { X, Upload, FileSpreadsheet, CheckCircle2, RotateCcw } from 'lucide-react'
import { Button, Badge } from '../index'
import { injectOnce } from '../_internal/style'
import { getAccounts, createTrade, createPosition, createPayment, searchSecurities, getExchangeRate, refreshPrices } from '../../api/client'
import type { CreateTradeInput, SecuritySearchResult } from '../../api/client'
import { usePortfolioStore } from '../../store/portfolioStore'
import { MODAL_CSS } from './modalShared'
import type { Account, Position, PaymentType } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

type ImportFormat = 'trades' | 'positions' | 'payments'

const FORMAT_LABEL: Record<ImportFormat, string> = {
  trades: 'Список сделок',
  positions: 'Текущие позиции (снэпшот)',
  payments: 'Дивиденды и купоны',
}

const FORMAT_UNIT: Record<ImportFormat, string> = {
  trades: 'сделок',
  positions: 'позиций',
  payments: 'выплат',
}

const ASSET_TYPE_LABEL: Record<'equity' | 'bond', string> = {
  equity: 'Акция',
  bond: 'Облигация',
}

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  dividend: 'Дивиденд',
  coupon: 'Купон',
  amortization: 'Амортизация',
  redemption: 'Погашение',
}

const ACCOUNT_ALIASES = ['счет', 'счёт', 'портфель', 'аккаунт', 'account']
const TICKER_ALIASES = ['тикер', 'инструмент', 'бумага', 'актив', 'ticker', 'symbol']
const CURRENCY_ALIASES = ['валюта', 'currency']
const DATE_ALIASES = ['дата', 'дата операции', 'дата сделки', 'дата выплаты', 'date']
const QUANTITY_ALIASES = ['кол-во', 'количество', 'кол во', 'quantity', 'qty']

type TradeFieldKey = 'date' | 'account' | 'ticker' | 'side' | 'quantity' | 'price' | 'fee' | 'currency'

const TRADE_ALIASES: Record<TradeFieldKey, string[]> = {
  date: DATE_ALIASES,
  account: ACCOUNT_ALIASES,
  ticker: TICKER_ALIASES,
  side: ['тип', 'тип операции', 'операция', 'вид операции', 'side', 'type'],
  quantity: QUANTITY_ALIASES,
  price: ['цена', 'цена исполнения', 'price'],
  fee: ['комиссия', 'комиссия брокера', 'fee'],
  currency: CURRENCY_ALIASES,
}

type PositionFieldKey = 'account' | 'ticker' | 'assetType' | 'quantity' | 'averagePrice' | 'currency'

const POSITION_ALIASES: Record<PositionFieldKey, string[]> = {
  account: ACCOUNT_ALIASES,
  ticker: TICKER_ALIASES,
  assetType: ['тип актива', 'вид актива', 'asset type'],
  quantity: QUANTITY_ALIASES,
  averagePrice: ['средняя цена', 'средняя цена покупки', 'цена покупки', 'average price', 'avg price'],
  currency: CURRENCY_ALIASES,
}

type PaymentFieldKey = 'date' | 'account' | 'ticker' | 'paymentType' | 'grossAmount' | 'taxWithheld' | 'netAmount' | 'currency'

const PAYMENT_ALIASES: Record<PaymentFieldKey, string[]> = {
  date: DATE_ALIASES,
  account: ACCOUNT_ALIASES,
  ticker: TICKER_ALIASES,
  paymentType: ['тип выплаты', 'вид выплаты', 'payment type'],
  grossAmount: ['сумма до налога', 'сумма до налогов', 'сумма до вычета налога', 'gross amount'],
  taxWithheld: ['налог', 'удержанный налог', 'tax', 'ндфл'],
  netAmount: ['сумма к получению', 'к получению', 'net amount'],
  currency: CURRENCY_ALIASES,
}

function normalizeHeader(h: string): string {
  return h.toString().trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ')
}

function buildFieldMap<K extends string>(headers: string[], aliases: Record<K, string[]>): Partial<Record<K, string>> {
  const map: Partial<Record<K, string>> = {}
  for (const header of headers) {
    const norm = normalizeHeader(header)
    for (const field of Object.keys(aliases) as K[]) {
      if (map[field]) continue
      if (aliases[field].includes(norm)) map[field] = header
    }
  }
  return map
}

/** Определяет формат файла по сигнатуре заголовков — см. CLAUDE.md «Способ 2: Импорт из Excel». */
function detectFormat(headers: string[]): ImportFormat {
  const norm = new Set(headers.map(normalizeHeader))
  const hasAny = (aliases: string[]) => aliases.some((a) => norm.has(a))

  const hasPaymentType = hasAny(PAYMENT_ALIASES.paymentType)
  const hasGross = hasAny(PAYMENT_ALIASES.grossAmount)
  const hasNet = hasAny(PAYMENT_ALIASES.netAmount)
  const hasAssetType = hasAny(POSITION_ALIASES.assetType)
  const hasAvgPrice = hasAny(POSITION_ALIASES.averagePrice)
  const hasSide = hasAny(TRADE_ALIASES.side)

  if (hasPaymentType || (hasGross && hasNet)) return 'payments'
  if (hasAssetType && hasAvgPrice && !hasSide) return 'positions'
  return 'trades'
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

function parseAssetType(value: unknown): 'equity' | 'bond' | null {
  const str = String(value ?? '').trim().toLowerCase()
  if (!str) return null
  if (str.startsWith('акци') || str === 'equity' || str === 'stock' || str === 'share' || str === 'shares') return 'equity'
  if (str.startsWith('облига') || str.startsWith('бонд') || str === 'bond' || str === 'bonds') return 'bond'
  return null
}

function parsePaymentType(value: unknown): PaymentType | null {
  const str = String(value ?? '').trim().toLowerCase()
  if (!str) return null
  if (str.startsWith('дивиденд') || str === 'dividend' || str === 'dividends') return 'dividend'
  if (str.startsWith('купон') || str === 'coupon' || str === 'coupons') return 'coupon'
  if (str.startsWith('амортизац') || str === 'amortization') return 'amortization'
  if (str.startsWith('погашен') || str === 'redemption') return 'redemption'
  return null
}

function resolveAccount(accountNameRaw: string, accounts: Account[]): { accountId: string | null; accountName: string; error?: string } {
  if (accountNameRaw) {
    const found = accounts.find((a) => a.name.trim().toLowerCase() === accountNameRaw.toLowerCase())
    if (found) return { accountId: found.id, accountName: found.name }
    return { accountId: null, accountName: accountNameRaw, error: `портфель «${accountNameRaw}» не найден` }
  }
  if (accounts.length === 1) return { accountId: accounts[0].id, accountName: accounts[0].name }
  if (accounts.length > 1) return { accountId: null, accountName: '', error: 'не указан портфель, а у вас их несколько' }
  return { accountId: null, accountName: '', error: 'нет ни одного портфеля' }
}

interface TradeRow {
  format: 'trades'
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

interface PositionRow {
  format: 'positions'
  rowNum: number
  accountName: string
  accountId: string | null
  ticker: string
  name?: string
  assetType: 'equity' | 'bond'
  assetTypeExplicit: boolean
  quantity: number
  averagePrice: number
  currency: string
  currencyExplicit: boolean
  exchange: string
  error: string | null
}

interface PaymentRow {
  format: 'payments'
  rowNum: number
  date: string
  accountName: string
  accountId: string | null
  ticker: string
  name?: string
  type: PaymentType | null
  grossAmount: number
  taxWithheld: number
  netAmount: number
  currency: string
  currencyExplicit: boolean
  error: string | null
}

type ParsedRow = TradeRow | PositionRow | PaymentRow

function buildTradeRow(raw: Record<string, unknown>, idx: number, fieldMap: Partial<Record<TradeFieldKey, string>>, accounts: Account[]): TradeRow {
  const get = (field: TradeFieldKey): unknown => {
    const key = fieldMap[field]
    return key != null ? raw[key] : undefined
  }

  const ticker = String(get('ticker') ?? '').trim().toUpperCase()
  const side = parseSide(get('side'))
  const quantity = parseNumber(get('quantity'))
  const price = parseNumber(get('price'))
  const fee = parseNumber(get('fee'))
  const currencyRaw = String(get('currency') ?? '').trim().toUpperCase()

  const errors: string[] = []
  if (!ticker) errors.push('не указан тикер')
  if (!side) errors.push('не указан тип операции (покупка/продажа)')
  if (!quantity || quantity <= 0) errors.push('некорректное количество')
  if (!price || price <= 0) errors.push('некорректная цена')

  const acc = resolveAccount(String(get('account') ?? '').trim(), accounts)
  if (acc.error) errors.push(acc.error)

  return {
    format: 'trades',
    rowNum: idx + 2,
    date: parseDateValue(get('date')),
    accountName: acc.accountName,
    accountId: acc.accountId,
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

function buildPositionRow(raw: Record<string, unknown>, idx: number, fieldMap: Partial<Record<PositionFieldKey, string>>, accounts: Account[]): PositionRow {
  const get = (field: PositionFieldKey): unknown => {
    const key = fieldMap[field]
    return key != null ? raw[key] : undefined
  }

  const ticker = String(get('ticker') ?? '').trim().toUpperCase()
  const assetTypeParsed = parseAssetType(get('assetType'))
  const quantity = parseNumber(get('quantity'))
  const averagePrice = parseNumber(get('averagePrice'))
  const currencyRaw = String(get('currency') ?? '').trim().toUpperCase()

  const errors: string[] = []
  if (!ticker) errors.push('не указан тикер')
  if (!quantity || quantity <= 0) errors.push('некорректное количество')
  if (!averagePrice || averagePrice <= 0) errors.push('некорректная средняя цена')

  const acc = resolveAccount(String(get('account') ?? '').trim(), accounts)
  if (acc.error) errors.push(acc.error)

  return {
    format: 'positions',
    rowNum: idx + 2,
    accountName: acc.accountName,
    accountId: acc.accountId,
    ticker,
    assetType: assetTypeParsed ?? 'equity',
    assetTypeExplicit: assetTypeParsed != null,
    quantity,
    averagePrice,
    currency: currencyRaw || 'RUB',
    currencyExplicit: !!currencyRaw,
    exchange: 'MOEX',
    error: errors.length > 0 ? errors.join('; ') : null,
  }
}

function buildPaymentRow(raw: Record<string, unknown>, idx: number, fieldMap: Partial<Record<PaymentFieldKey, string>>, accounts: Account[]): PaymentRow {
  const get = (field: PaymentFieldKey): unknown => {
    const key = fieldMap[field]
    return key != null ? raw[key] : undefined
  }

  const ticker = String(get('ticker') ?? '').trim().toUpperCase()
  const type = parsePaymentType(get('paymentType'))
  const grossAmount = parseNumber(get('grossAmount'))
  const taxWithheld = parseNumber(get('taxWithheld'))
  const netAmountRaw = parseNumber(get('netAmount'))
  const currencyRaw = String(get('currency') ?? '').trim().toUpperCase()

  const errors: string[] = []
  if (!ticker) errors.push('не указан тикер')
  if (!type) errors.push('не указан тип выплаты (дивиденд/купон/амортизация/погашение)')
  if (!grossAmount || grossAmount <= 0) errors.push('некорректная сумма до налога')

  const acc = resolveAccount(String(get('account') ?? '').trim(), accounts)
  if (acc.error) errors.push(acc.error)

  const netAmount = netAmountRaw > 0 ? netAmountRaw : Math.round((grossAmount - taxWithheld) * 100) / 100

  return {
    format: 'payments',
    rowNum: idx + 2,
    date: parseDateValue(get('date')),
    accountName: acc.accountName,
    accountId: acc.accountId,
    ticker,
    type,
    grossAmount,
    taxWithheld,
    netAmount,
    currency: currencyRaw || 'RUB',
    currencyExplicit: !!currencyRaw,
    error: errors.length > 0 ? errors.join('; ') : null,
  }
}

const fmtNum = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 4 })

interface ImportResult {
  success: number
  failed: number
  format: ImportFormat
}

export function ImportModal({ open, onClose }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const bump = usePortfolioStore((s) => s.bump)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [format, setFormat] = useState<ImportFormat>('trades')
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

      const headers = Object.keys(raw[0])
      const fmt = detectFormat(headers)

      let parsed: ParsedRow[]
      if (fmt === 'payments') {
        const fieldMap = buildFieldMap(headers, PAYMENT_ALIASES)
        if (!fieldMap.ticker || !fieldMap.grossAmount) {
          throw new Error('Не удалось определить колонки файла выплат. Нужны как минимум: Тикер, Сумма до налога')
        }
        parsed = raw.map((r, i) => buildPaymentRow(r, i, fieldMap, accounts))
      } else if (fmt === 'positions') {
        const fieldMap = buildFieldMap(headers, POSITION_ALIASES)
        if (!fieldMap.ticker || !fieldMap.quantity || !fieldMap.averagePrice) {
          throw new Error('Не удалось определить колонки файла позиций. Нужны как минимум: Тикер, Кол-во, Средняя цена')
        }
        parsed = raw.map((r, i) => buildPositionRow(r, i, fieldMap, accounts))
      } else {
        const fieldMap = buildFieldMap(headers, TRADE_ALIASES)
        if (!fieldMap.ticker || !fieldMap.side || !fieldMap.quantity || !fieldMap.price) {
          throw new Error('Не удалось определить колонки файла. Нужны как минимум: Тикер, Тип, Количество, Цена')
        }
        parsed = raw.map((r, i) => buildTradeRow(r, i, fieldMap, accounts))
      }

      // Обогащение по тикерам: тип актива, валюта, название бумаги, биржа
      const tickers = [...new Set(parsed.filter((r) => !r.error).map((r) => r.ticker))]
      const found = await Promise.all(
        tickers.map((t) => searchSecurities(t).then((res) => res[0]).catch(() => undefined))
      )
      const enrichMap = new Map<string, SecuritySearchResult | undefined>(tickers.map((t, i) => [t, found[i]]))

      for (const row of parsed) {
        if (row.error) continue
        const match = enrichMap.get(row.ticker)
        if (!match) continue
        if (row.format === 'trades') {
          if (match.assetType) row.assetType = match.assetType
          if (!row.currencyExplicit) row.currency = match.currency
          row.name = match.shortName
        } else if (row.format === 'positions') {
          if (!row.assetTypeExplicit && match.assetType) row.assetType = match.assetType
          if (!row.currencyExplicit) row.currency = match.currency
          row.exchange = match.exchange
          row.name = match.shortName
        } else {
          if (!row.currencyExplicit) row.currency = match.currency
          row.name = match.shortName
        }
      }

      // Курсы валют для не-рублёвых строк (нужны для приведения сделок/позиций к рублю)
      if (fmt !== 'payments') {
        const currencies = [...new Set(parsed.filter((r) => !r.error && r.currency !== 'RUB').map((r) => r.currency))]
        for (const cur of currencies) {
          try {
            const r = await getExchangeRate(cur)
            ratesRef.current.set(cur, r.rate)
          } catch {
            // курс не получен — позиция будет учтена по курсу 1, пользователь сможет поправить вручную
          }
        }
      }

      setFormat(fmt)
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
    let positionsImported = false

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (row.error || !row.accountId) { failed++; continue }
      try {
        if (row.format === 'trades') {
          if (!row.side) { failed++; continue }
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
        } else if (row.format === 'positions') {
          // Поля выпуска облигации (номинал, купон, дата погашения) необязательны на сервере —
          // справочные данные MOEX подтянутся при обновлении цен после импорта.
          const payload = {
            accountId: row.accountId,
            ticker: row.ticker,
            name: row.name,
            exchange: row.exchange,
            assetType: row.assetType,
            currency: row.currency,
            quantity: row.quantity,
            averagePrice: row.averagePrice,
            averagingMethod: 'WAVG',
            exchangeRate: row.currency !== 'RUB' ? ratesRef.current.get(row.currency) : undefined,
          } as unknown as Omit<Position, 'id'>
          await createPosition(payload)
          positionsImported = true
        } else {
          if (!row.type) { failed++; continue }
          await createPayment({
            accountId: row.accountId,
            ticker: row.ticker,
            type: row.type,
            paymentDate: row.date.slice(0, 10),
            grossAmount: row.grossAmount,
            taxWithheld: row.taxWithheld,
            netAmount: row.netAmount,
            currency: row.currency,
          })
        }
        success++
      } catch (err) {
        failed++
        updated[i] = { ...row, error: err instanceof Error ? err.message : String(err) }
      }
    }

    setRows(updated)
    setResult({ success, failed, format })
    setImporting(false)
    if (success > 0) {
      bump()
      if (positionsImported) refreshPrices().catch(() => {})
    }
  }

  if (!open) return null

  const validCount = rows.filter((r) => !r.error).length
  const errorCount = rows.length - validCount

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal ia-modal--wide" role="dialog" aria-modal="true" aria-label="Импорт данных">
        <div className="ia-modal__head">
          <span className="ia-modal__title">
            Импорт данных{rows.length > 0 && !result ? ` · ${FORMAT_LABEL[format]}` : ''}
          </span>
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
                  Успешно добавлено {FORMAT_UNIT[result.format]}: {result.success} из {rows.length}
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
                    <span>Выберите файл .csv или .xlsx — формат определится автоматически</span>
                    <span className="ia-import-drop__hint">
                      Сделки: Дата, Счёт, Тикер, Тип (покупка/продажа), Кол-во, Цена, Комиссия, Валюта.<br />
                      Текущие позиции: Счёт, Тикер, Тип актива, Кол-во, Средняя цена, Валюта.<br />
                      Дивиденды/купоны: Дата, Счёт, Тикер, Тип выплаты, Сумма до налога, Налог, Сумма к получению.<br />
                      Названия колонок могут отличаться — попробуем сопоставить автоматически.
                    </span>
                  </>
                )}
              </label>
            )
          ) : (
            <>
              <div className="ia-import-stats">
                <span>Формат: <b>{FORMAT_LABEL[format]}</b></span>
                <span>Всего строк: <b>{rows.length}</b></span>
                <span>Готово к импорту: <b>{validCount}</b></span>
                {errorCount > 0 && <span>С ошибками: <b>{errorCount}</b></span>}
              </div>

              <div className="ia-import-table-wrap">
                <table className="ia-table">
                  {format === 'trades' && (
                    <>
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
                        {(rows as TradeRow[]).map((row, i) => (
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
                    </>
                  )}

                  {format === 'positions' && (
                    <>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Портфель</th>
                          <th>Тикер</th>
                          <th>Тип актива</th>
                          <th className="r">Кол-во</th>
                          <th className="r">Средняя цена</th>
                          <th>Валюта</th>
                          <th>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rows as PositionRow[]).map((row, i) => (
                          <tr key={i} className={row.error ? 'ia-import-row--error' : ''}>
                            <td>{row.rowNum}</td>
                            <td>{row.accountName || '—'}</td>
                            <td>{row.ticker}{row.name ? ` · ${row.name}` : ''}</td>
                            <td>{ASSET_TYPE_LABEL[row.assetType]}</td>
                            <td className="r">{row.quantity > 0 ? fmtNum(row.quantity) : '—'}</td>
                            <td className="r">{row.averagePrice > 0 ? fmtNum(row.averagePrice) : '—'}</td>
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
                    </>
                  )}

                  {format === 'payments' && (
                    <>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Дата</th>
                          <th>Портфель</th>
                          <th>Тикер</th>
                          <th>Тип выплаты</th>
                          <th className="r">До налога</th>
                          <th className="r">Налог</th>
                          <th className="r">К получению</th>
                          <th>Валюта</th>
                          <th>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rows as PaymentRow[]).map((row, i) => (
                          <tr key={i} className={row.error ? 'ia-import-row--error' : ''}>
                            <td>{row.rowNum}</td>
                            <td>{new Date(row.date).toLocaleDateString('ru-RU')}</td>
                            <td>{row.accountName || '—'}</td>
                            <td>{row.ticker}{row.name ? ` · ${row.name}` : ''}</td>
                            <td>{row.type ? PAYMENT_TYPE_LABEL[row.type] : '—'}</td>
                            <td className="r">{row.grossAmount > 0 ? fmtNum(row.grossAmount) : '—'}</td>
                            <td className="r">{fmtNum(row.taxWithheld)}</td>
                            <td className="r">{fmtNum(row.netAmount)}</td>
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
                    </>
                  )}
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
