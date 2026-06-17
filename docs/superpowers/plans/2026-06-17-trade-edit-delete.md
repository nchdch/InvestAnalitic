# Trade Edit & Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить редактирование и удаление сделок с корректным пересчётом позиции после каждого изменения.

**Architecture:** Новая функция `rebuildPosition()` пересчитывает позицию с нуля из всех оставшихся сделок (WAVG). `deleteTrade()` исправляется, добавляется `updateTrade()`. На фронте `TradeModal` получает режим редактирования, `TradesListModal` — кнопку Pencil.

**Tech Stack:** Node.js/TypeScript (backend), React/TypeScript (frontend), PostgreSQL (pool/transactions via `pg`)

---

## Затрагиваемые файлы

| Файл | Действие |
|------|----------|
| `server/src/services/positionService.ts` | Добавить `rebuildPosition()`, экспортировать тип `PositionMeta` |
| `server/src/services/tradeService.ts` | Добавить `updateTrade()`, исправить `deleteTrade()` |
| `server/src/controllers/tradeController.ts` | Добавить `update()` handler |
| `server/src/routes/trades.ts` | Добавить `PUT /:id` |
| `src/api/client.ts` | Добавить `updateTrade()` |
| `src/components/portfolio/TradeModal.tsx` | Добавить prop `editTrade`, режим редактирования |
| `src/components/portfolio/TradesListModal.tsx` | Добавить Pencil кнопку + стейт `editingTrade` |

---

## Task 1: `rebuildPosition()` в positionService.ts

**Files:**
- Modify: `server/src/services/positionService.ts`

- [ ] **Step 1: Добавить тип `PositionMeta` и функцию `rebuildPosition` в positionService.ts**

Добавить в конец файла `server/src/services/positionService.ts` (после `applySellToPosition`):

```ts
/** Метаданные для создания позиции, если её ещё нет на счёте. */
export interface PositionMeta {
  name?: string
  exchange: string
  assetType: 'equity' | 'bond'
  currency: string
  exchangeRate?: number
}

/**
 * Пересчитать позицию по (accountId, ticker) с нуля из всех оставшихся сделок.
 * Вызывать внутри транзакции, передавая client.
 * Если quantity <= 0 — позиция удаляется.
 * Если позиции нет, но quantity > 0 — создаётся с данными из meta.
 */
export async function rebuildPosition(
  client: { query: typeof pool.query },
  accountId: string,
  ticker: string,
  meta?: PositionMeta,
): Promise<void> {
  // Все сделки по паре (account, ticker) в хронологическом порядке
  const { rows: tradeRows } = await client.query(
    `SELECT side, quantity, price FROM trades
     WHERE account_id = $1 AND ticker = $2
     ORDER BY executed_at ASC`,
    [accountId, ticker],
  )

  let totalQty = 0
  let weightedSum = 0
  let buyQty = 0

  for (const t of tradeRows) {
    const qty = Number(t.quantity)
    const price = Number(t.price)
    if (t.side === 'buy') {
      totalQty += qty
      weightedSum += qty * price
      buyQty += qty
    } else {
      totalQty -= qty
    }
  }

  const avgPrice = buyQty > 0 ? weightedSum / buyQty : 0

  const { rows: posRows } = await client.query(
    'SELECT id FROM positions WHERE account_id = $1 AND ticker = $2',
    [accountId, ticker],
  )

  if (totalQty <= 0) {
    // Нет бумаг — удалить позицию
    await client.query(
      'DELETE FROM positions WHERE account_id = $1 AND ticker = $2',
      [accountId, ticker],
    )
    return
  }

  if (posRows.length > 0) {
    // Позиция существует — обновить quantity и average_price
    await client.query(
      'UPDATE positions SET quantity = $1, average_price = $2, updated_at = NOW() WHERE id = $3',
      [totalQty, avgPrice, posRows[0].id],
    )
  } else {
    // Позиции нет — создать с метаданными
    if (!meta) throw new Error(`Позиция ${ticker} не найдена на счёте, метаданные не переданы`)
    await client.query(
      `INSERT INTO positions
        (account_id, ticker, name, exchange, asset_type, currency, quantity, average_price, averaging_method, exchange_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'WAVG', $9)`,
      [
        accountId, ticker, meta.name ?? ticker,
        meta.exchange, meta.assetType, meta.currency,
        totalQty, avgPrice, meta.exchangeRate ?? 1,
      ],
    )
  }
}
```

- [ ] **Step 2: Проверить компиляцию бэкенда**

```bash
cd server && npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок (или только уже существовавшие до этого изменения).

- [ ] **Step 3: Коммит**

```bash
git add server/src/services/positionService.ts
git commit -m "feat: rebuildPosition — пересчёт позиции из всех сделок (WAVG)"
```

---

## Task 2: Исправить `deleteTrade()` и добавить `updateTrade()` в tradeService.ts

**Files:**
- Modify: `server/src/services/tradeService.ts`

- [ ] **Step 1: Исправить `deleteTrade()` — добавить транзакцию и пересчёт позиции**

Заменить существующую функцию `deleteTrade` в `server/src/services/tradeService.ts`:

```ts
export async function deleteTrade(id: string) {
  const existing = await getTrade(id)
  if (!existing) return false

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM trades WHERE id = $1', [id])
    await rebuildPosition(client, existing.accountId as string, existing.ticker as string)
    await client.query('COMMIT')
    return true
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
```

Добавить импорт `rebuildPosition` в начало файла (после существующего импорта из positionService):

```ts
import { applyBuyToPosition, applySellToPosition, rebuildPosition } from './positionService.js'
```

Заменить строку `import { applyBuyToPosition, applySellToPosition } from './positionService.js'`.

- [ ] **Step 2: Добавить `UpdateTradeInput` и `updateTrade()` в tradeService.ts**

Добавить в конец файла `server/src/services/tradeService.ts` (после исправленного `deleteTrade`):

```ts
export interface UpdateTradeInput {
  quantity?: number
  price?: number
  fee?: number
  currency?: string
  executedAt?: string
  exchangeRate?: number
  accountId?: string
}

export async function updateTrade(id: string, patch: UpdateTradeInput) {
  const existing = await getTrade(id)
  if (!existing) return null

  const oldAccountId = existing.accountId as string
  const ticker = existing.ticker as string
  const newAccountId = patch.accountId ?? oldAccountId
  const accountChanged = newAccountId !== oldAccountId

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Получить метаданные позиции на старом счёте (для создания на новом, если нужно)
    const { rows: metaRows } = await client.query(
      'SELECT name, exchange, asset_type, currency, exchange_rate FROM positions WHERE account_id = $1 AND ticker = $2',
      [oldAccountId, ticker],
    )
    const oldMeta = metaRows[0]

    const fields: string[] = []
    const vals: unknown[] = []
    let i = 1
    const add = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); vals.push(val) }

    if (patch.quantity !== undefined) add('quantity', patch.quantity)
    if (patch.price !== undefined) add('price', patch.price)
    if (patch.fee !== undefined) add('fee', patch.fee)
    if (patch.currency !== undefined) add('currency', patch.currency)
    if (patch.executedAt !== undefined) add('executed_at', patch.executedAt)
    if (patch.accountId !== undefined) add('account_id', patch.accountId)

    if (fields.length > 0) {
      vals.push(id)
      await client.query(
        `UPDATE trades SET ${fields.join(', ')} WHERE id = $${i}`,
        vals,
      )
    }

    // Пересчитать позицию на старом счёте
    await rebuildPosition(client, oldAccountId, ticker)

    // Если счёт изменился — пересчитать на новом счёте
    if (accountChanged && oldMeta) {
      await rebuildPosition(client, newAccountId, ticker, {
        name: oldMeta.name,
        exchange: oldMeta.exchange,
        assetType: oldMeta.asset_type as 'equity' | 'bond',
        currency: oldMeta.currency,
        exchangeRate: Number(oldMeta.exchange_rate),
      })
    }

    await client.query('COMMIT')
    return getTrade(id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
```

- [ ] **Step 3: Проверить компиляцию бэкенда**

```bash
cd server && npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 4: Коммит**

```bash
git add server/src/services/tradeService.ts
git commit -m "feat: updateTrade + fix deleteTrade — пересчёт позиции в транзакции"
```

---

## Task 3: Контроллер `update` и маршрут `PUT /trades/:id`

**Files:**
- Modify: `server/src/controllers/tradeController.ts`
- Modify: `server/src/routes/trades.ts`

- [ ] **Step 1: Добавить handler `update` в tradeController.ts**

Добавить в конец файла `server/src/controllers/tradeController.ts`:

```ts
export async function update(req: AuthRequest, res: Response) {
  const existing = await svc.getTrade(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Trade not found' })

  const accessible = await getAccessibleAccountIds(req.userId!)
  if (!accessible.includes(existing.accountId as string)) {
    return res.status(404).json({ error: 'Trade not found' })
  }

  const body = req.body as svc.UpdateTradeInput

  // Валидация числовых полей
  if (body.quantity !== undefined && (body.quantity <= 0 || !Number.isFinite(body.quantity))) {
    return res.status(400).json({ error: 'quantity должен быть больше 0' })
  }
  if (body.price !== undefined && (body.price <= 0 || !Number.isFinite(body.price))) {
    return res.status(400).json({ error: 'price должен быть больше 0' })
  }

  // Проверить доступ к новому accountId, если он передан
  if (body.accountId && !accessible.includes(body.accountId)) {
    return res.status(403).json({ error: 'Нет доступа к счёту' })
  }

  try {
    const updated = await svc.updateTrade(req.params.id, body)
    if (!updated) return res.status(404).json({ error: 'Trade not found' })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
```

- [ ] **Step 2: Зарегистрировать маршрут PUT /:id в routes/trades.ts**

Заменить содержимое `server/src/routes/trades.ts`:

```ts
import { Router } from 'express'
import { list, get, create, remove, update } from '../controllers/tradeController.js'
import { requireAuth } from '../middleware/auth.js'

export const tradeRouter = Router()
tradeRouter.use(requireAuth)
tradeRouter.get('/', list)
tradeRouter.post('/', create)
tradeRouter.get('/:id', get)
tradeRouter.put('/:id', update)
tradeRouter.delete('/:id', remove)
```

- [ ] **Step 3: Проверить компиляцию бэкенда**

```bash
cd server && npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 4: Коммит**

```bash
git add server/src/controllers/tradeController.ts server/src/routes/trades.ts
git commit -m "feat: PUT /trades/:id — эндпоинт редактирования сделки"
```

---

## Task 4: `updateTrade()` в api/client.ts

**Files:**
- Modify: `src/api/client.ts`

- [ ] **Step 1: Добавить тип и функцию `updateTrade` в api/client.ts**

Найти в `src/api/client.ts` строку с `export function deleteTrade`. Добавить **перед** ней:

```ts
export interface UpdateTradeInput {
  quantity?: number
  price?: number
  fee?: number
  currency?: string
  executedAt?: string
  exchangeRate?: number
  accountId?: string
}

export function updateTrade(id: string, patch: UpdateTradeInput): Promise<Trade> {
  return request<Trade>(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
}
```

- [ ] **Step 2: Проверить компиляцию фронтенда**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 3: Коммит**

```bash
git add src/api/client.ts
git commit -m "feat: updateTrade в api/client"
```

---

## Task 5: Режим редактирования в TradeModal.tsx

**Files:**
- Modify: `src/components/portfolio/TradeModal.tsx`

- [ ] **Step 1: Добавить prop `editTrade` и расширить интерфейсы**

В начале файла `src/components/portfolio/TradeModal.tsx`, в импорты добавить `updateTrade` и `UpdateTradeInput`:

```ts
import { getAccounts, createAccount, createTrade, getExchangeRate, getSecurityPrice, updateTrade } from '../../api/client'
```

В интерфейс `Props` добавить новый опциональный prop (после `initial?`):

```ts
interface Props {
  open: boolean
  onClose: () => void
  initial?: TradeModalInitial
  /** Если передан — форма открывается в режиме редактирования этой сделки. */
  editTrade?: {
    id: string
    ticker: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    fee: number
    currency: string
    executedAt: string
    accountId: string
    name?: string
    assetType?: 'equity' | 'bond'
    exchange?: string
  }
}
```

- [ ] **Step 2: Инициализировать форму из `editTrade` при открытии**

Найти `useEffect` с зависимостью `[open]` (строки ~81–97). Заменить его полностью:

```ts
useEffect(() => {
  if (!open) return
  if (editTrade) {
    setForm({
      accountId: editTrade.accountId,
      ticker: editTrade.ticker,
      name: editTrade.name ?? '',
      assetType: editTrade.assetType ?? 'equity',
      exchange: editTrade.exchange ?? 'MOEX',
      side: editTrade.side,
      quantity: String(editTrade.quantity),
      price: String(editTrade.price),
      fee: String(editTrade.fee),
      currency: editTrade.currency,
      exchangeRate: '',
      executedAt: editTrade.executedAt.slice(0, 10),
    })
  } else {
    setForm({ ...EMPTY, executedAt: today(), ...initial })
  }
  setError('')
  setRateDate('')
  setPriceLoaded(false)
  setPriceUnavailable(false)
  setNewAccName('')
  setNewAccBroker('')
  getAccounts()
    .then((list) => {
      setAccounts(list)
      if (list.length > 0 && !initial?.accountId && !editTrade) {
        setForm((f) => ({ ...f, accountId: list[0].id }))
      }
    })
    .catch(() => setAccounts([]))
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [open])
```

- [ ] **Step 3: Изменить handleSubmit для поддержки обоих режимов**

Найти `const handleSubmit = async (e: React.FormEvent)` и заменить блок `try { ... }` внутри:

```ts
setSubmitting(true)
try {
  if (editTrade) {
    // Режим редактирования
    await updateTrade(editTrade.id, {
      quantity: qty,
      price,
      fee: Number(form.fee) || 0,
      currency: form.currency,
      executedAt: form.executedAt ? new Date(form.executedAt).toISOString() : undefined,
      exchangeRate: form.currency !== 'RUB' ? Number(form.exchangeRate) || undefined : undefined,
      accountId: form.accountId || undefined,
    })
  } else {
    // Режим создания
    let accountId = form.accountId
    if (needNewAccount) {
      if (!newAccName.trim()) return setError('Введите название портфеля')
      if (!newAccBroker.trim()) return setError('Введите брокера')
      const acc = await createAccount(newAccName.trim(), newAccBroker.trim())
      accountId = acc.id
    }
    await createTrade({
      accountId,
      ticker: form.ticker.trim().toUpperCase(),
      name: form.name.trim() || undefined,
      side: form.side,
      quantity: qty,
      price,
      fee: Number(form.fee) || 0,
      currency: form.currency,
      exchangeRate: form.currency !== 'RUB' ? Number(form.exchangeRate) : undefined,
      assetType: form.assetType,
      exchange: form.exchange,
      executedAt: form.executedAt ? new Date(form.executedAt).toISOString() : undefined,
    })
  }
  bump()
  onClose()
} catch (err) {
  setError(err instanceof Error ? err.message : String(err))
} finally {
  setSubmitting(false)
}
```

- [ ] **Step 4: Обновить заголовок и заблокировать тикер/направление в режиме редактирования**

В JSX найти `<span className="ia-modal__title">Добавить сделку</span>` и заменить:

```tsx
<span className="ia-modal__title">{editTrade ? 'Редактировать сделку' : 'Добавить сделку'}</span>
```

В блоке «Тип актива» — обернуть в условие: показывать переключатель только если НЕ режим редактирования, иначе показать текст:

```tsx
{/* Тип актива */}
{editTrade ? (
  <div className="ia-modal-section-label" style={{ marginBottom: 4 }}>
    {form.assetType === 'equity' ? 'Акция' : 'Облигация'} · {form.ticker}
  </div>
) : (
  <div>
    <div className="ia-modal-section-label" style={{ marginBottom: 6 }}>Тип актива</div>
    <div className="ia-toggle-row">
      <button
        type="button"
        className={`ia-toggle-btn${form.assetType === 'equity' ? ' is-active' : ''}`}
        onClick={() => set('assetType', 'equity')}
      >
        <TrendingUp size={15} /> Акция
      </button>
      <button
        type="button"
        className={`ia-toggle-btn${form.assetType === 'bond' ? ' is-active' : ''}`}
        onClick={() => set('assetType', 'bond')}
      >
        <Layers size={15} /> Облигация
      </button>
    </div>
  </div>
)}
```

В блоке «Операция» — аналогично: скрыть переключатель buy/sell в режиме редактирования, показать текст:

```tsx
{/* Направление */}
{editTrade ? (
  <div className="ia-modal-section-label" style={{ marginBottom: 4 }}>
    {form.side === 'buy' ? 'Покупка' : 'Продажа'}
  </div>
) : (
  <div>
    <div className="ia-modal-section-label" style={{ marginBottom: 6 }}>Операция</div>
    <div className="ia-toggle-row">
      <button
        type="button"
        className={`ia-toggle-btn${form.side === 'buy' ? ' is-active' : ''}`}
        onClick={() => set('side', 'buy')}
      >
        Покупка
      </button>
      <button
        type="button"
        className={`ia-toggle-btn is-sell${form.side === 'sell' ? ' is-active' : ''}`}
        onClick={() => set('side', 'sell')}
      >
        Продажа
      </button>
    </div>
  </div>
)}
```

В блоке «Поиск бумаги» — скрыть `SecuritySearchInput` в режиме редактирования (тикер неизменяем):

```tsx
{/* Поиск бумаги — только при создании */}
{!editTrade && (
  <SecuritySearchInput
    selectedTicker={form.ticker}
    onSelect={(s: SecuritySearchResult) => {
      set('ticker', s.ticker)
      set('name', s.shortName)
      if (s.assetType) set('assetType', s.assetType)
      set('currency', s.currency)
      set('exchange', s.exchange)
    }}
  />
)}
```

Кнопку «Купить/Продать» обновить:

```tsx
<Button type="submit" loading={submitting}>
  {editTrade ? 'Сохранить' : form.side === 'buy' ? 'Купить' : 'Продать'}
</Button>
```

- [ ] **Step 5: Отключить автозагрузку цены в режиме редактирования**

В `TradeModal.tsx` найти useEffect с `loadPrice` (зависимости `[form.ticker, form.assetType, open]`) и добавить ранний выход для editTrade:

```ts
useEffect(() => {
  if (!open) return
  if (editTrade) return          // ← добавить эту строку
  if (!form.ticker.trim()) return
  loadPrice(form.ticker, form.assetType)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [form.ticker, form.assetType, open])
```

Это предотвращает перезапись исторической цены текущей котировкой при открытии формы редактирования.

- [ ] **Step 6: Проверить компиляцию фронтенда**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 7: Коммит**

```bash
git add src/components/portfolio/TradeModal.tsx
git commit -m "feat: TradeModal — режим редактирования сделки"
```

---

## Task 6: Кнопка редактирования в TradesListModal.tsx

**Files:**
- Modify: `src/components/portfolio/TradesListModal.tsx`

- [ ] **Step 1: Импортировать Pencil и TradeModal**

Заменить строку импорта иконок:

```ts
import { X, Trash2, Pencil } from 'lucide-react'
```

Добавить импорт `TradeModal` (после существующих импортов компонентов):

```ts
import { TradeModal } from './TradeModal'
```

- [ ] **Step 2: Добавить стейт `editingTrade`**

В теле функции `TradesListModal`, после строки `const [deletingId, setDeletingId] = useState<string | null>(null)` добавить:

```ts
const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
```

- [ ] **Step 3: Добавить кнопку Pencil в каждую строку таблицы**

Найти блок `<td className="r">` с кнопкой Trash2 (строки ~100–110). Заменить этот `<td>` на:

```tsx
<td className="r" style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
  <button
    type="button"
    className="ia-table-icon-btn"
    onClick={() => setEditingTrade(t)}
    aria-label="Редактировать сделку"
    title="Редактировать"
  >
    <Pencil size={14} />
  </button>
  <button
    type="button"
    className="ia-table-icon-btn"
    onClick={() => handleDelete(t.id)}
    disabled={deletingId === t.id}
    aria-label="Удалить сделку"
    title="Удалить"
  >
    <Trash2 size={14} />
  </button>
</td>
```

- [ ] **Step 4: Рендерить TradeModal в режиме редактирования**

В JSX, перед закрывающим тегом `</div>` основного backdrop (самый последний), добавить:

```tsx
<TradeModal
  open={!!editingTrade}
  editTrade={editingTrade ? {
    id: editingTrade.id,
    ticker: editingTrade.ticker,
    side: editingTrade.side,
    quantity: editingTrade.quantity,
    price: editingTrade.price,
    fee: editingTrade.fee,
    currency: editingTrade.currency,
    executedAt: editingTrade.executedAt,
    accountId: editingTrade.accountId,
  } : undefined}
  onClose={() => {
    setEditingTrade(null)
    load()
  }}
/>
```

- [ ] **Step 5: Проверить компиляцию фронтенда**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 6: Коммит**

```bash
git add src/components/portfolio/TradesListModal.tsx
git commit -m "feat: TradesListModal — кнопка редактирования сделки"
```

---

## Task 7: Ручная проверка в браузере

- [ ] **Step 1: Запустить сервер и фронтенд**

```bash
# Терминал 1 — бэкенд
cd server && npm run dev

# Терминал 2 — фронтенд
npm run dev
```

- [ ] **Step 2: Проверить удаление сделки**

1. Открыть список сделок по любой позиции (клик на строку портфеля → «Все сделки»).
2. Нажать Trash2 → подтвердить.
3. Убедиться: сделка исчезла из списка, количество бумаг на позиции пересчиталось корректно (если удалена одна из нескольких покупок — avgPrice изменилась, если удалена единственная сделка — позиция исчезла из портфеля).

- [ ] **Step 3: Проверить редактирование — числовые поля**

1. Открыть список сделок, нажать Pencil на любой сделке.
2. Убедиться: заголовок «Редактировать сделку», тикер/направление отображаются как текст (не редактируемы).
3. Изменить цену и/или количество → «Сохранить».
4. Убедиться: сделка обновилась в списке, средняя цена позиции пересчиталась.

- [ ] **Step 4: Проверить редактирование — смена счёта (если есть несколько счетов)**

1. Открыть список сделок, нажать Pencil.
2. Сменить «Портфель» на другой счёт → «Сохранить».
3. Убедиться: позиция на старом счёте уменьшилась/удалена, на новом появилась/обновилась.

- [ ] **Step 5: Финальный коммит (если нет незакоммиченных изменений)**

```bash
git status
```

Все изменения должны быть закоммичены по задачам выше.
