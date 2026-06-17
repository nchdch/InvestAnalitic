# Редактирование и удаление сделок

**Дата:** 2026-06-17

## Контекст

В текущей реализации:
- `DELETE /trades/:id` существует, но `deleteTrade()` не пересчитывает позицию — баг.
- `PUT /trades/:id` отсутствует.
- `TradesListModal` показывает список сделок с кнопкой удаления (без пересчёта позиции).
- `TradeModal` используется только для создания сделки.

## Цель

Добавить возможность редактировать и удалять сделки. После любого изменения позиция пересчитывается корректно.

---

## Бэкенд

### 1. `rebuildPosition(client, accountId, ticker)` — `positionService.ts`

Новая функция. Алгоритм:
1. Выбрать все сделки по `(accountId, ticker)` упорядоченно по `executed_at ASC`.
2. Пройти по ним: `quantity = sum(buys) - sum(sells)`, WAVG = сумма `(qty * price)` по покупкам / сумма qty покупок.
3. Если `quantity <= 0` — удалить позицию (`DELETE FROM positions WHERE account_id=$1 AND ticker=$2`).
4. Иначе — обновить `quantity` и `average_price` в позиции (создать позицию, если её нет — используя метаданные из первой сделки-покупки).

Функция принимает `client` (транзакционный), не создаёт собственную транзакцию.

### 2. `updateTrade(id, patch)` — `tradeService.ts`

```ts
export interface UpdateTradeInput {
  quantity?: number
  price?: number
  fee?: number
  currency?: string
  executedAt?: string
  exchangeRate?: number
  accountId?: string  // смена счёта
}
```

Транзакция:
1. Получить текущую сделку (старый `accountId`, `ticker`).
2. UPDATE trades SET ... WHERE id = $1.
3. Вызвать `rebuildPosition(client, oldAccountId, ticker)`.
4. Если `accountId` изменился — вызвать `rebuildPosition(client, newAccountId, ticker)`.
5. COMMIT.

Тикер (`ticker`) и направление (`side`) не изменяемы через этот метод.

### 3. Исправить `deleteTrade(id)` — `tradeService.ts`

Обернуть в транзакцию:
1. Получить сделку (accountId, ticker).
2. DELETE FROM trades WHERE id = $1.
3. Вызвать `rebuildPosition(client, accountId, ticker)`.
4. COMMIT.

### 4. `PUT /trades/:id` — `routes/trades.ts` + `tradeController.ts`

Новый маршрут. Контроллер:
- Проверить, что сделка существует и принадлежит пользователю.
- Валидация: `quantity > 0`, `price > 0`.
- Если передан `accountId` — проверить доступ к новому счёту.
- Вызвать `svc.updateTrade(id, patch)`.
- Вернуть 200 с обновлённой сделкой.

---

## Фронтенд

### 5. `updateTrade(id, patch)` — `api/client.ts`

```ts
export function updateTrade(id: string, patch: UpdateTradeInput): Promise<Trade> {
  return request<Trade>(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
}
```

### 6. `TradeModal` — режим редактирования

Новый prop: `editTrade?: Trade & { name?: string; assetType?: string; exchange?: string }`.

Поведение:
- Если `editTrade` передан — форма открывается в режиме редактирования.
- Заголовок: «Редактировать сделку».
- Тикер и направление (buy/sell) — locked (отображаются как текст, не как поля ввода).
- Поля для редактирования: `quantity`, `price`, `fee`, `currency`, `executedAt`, `exchangeRate`, `accountId`.
- Сабмит вызывает `updateTrade(editTrade.id, patch)` вместо `createTrade(...)`.
- После успеха: `bump()` + `onClose()`.

### 7. `TradesListModal` — кнопка редактирования

- Добавить иконку `Pencil` (lucide-react) рядом с `Trash2` в каждой строке.
- Локальный стейт `editingTrade: Trade | null`.
- Клик по Pencil → `setEditingTrade(trade)` → рендер `<TradeModal open={!!editingTrade} editTrade={editingTrade} onClose={() => { setEditingTrade(null); load() }} />`.
- После закрытия редактора — перезагрузить список сделок (`load()`).
- Текст confirm при удалении: «Удалить сделку? Позиция будет пересчитана.» (уже корректный).

---

## Ограничения

- Тикер и направление сделки (`side`) неизменяемы. Для смены тикера — удалить и создать заново.
- При смене `accountId` — позиция на старом и новом счёте пересчитываются в одной транзакции.
- Если после удаления/редактирования количество на позиции становится отрицательным — операция отклоняется с ошибкой.

---

## Затронутые файлы

| Файл | Изменение |
|------|-----------|
| `server/src/services/positionService.ts` | + `rebuildPosition()` |
| `server/src/services/tradeService.ts` | + `updateTrade()`, fix `deleteTrade()` |
| `server/src/controllers/tradeController.ts` | + `update()` handler |
| `server/src/routes/trades.ts` | + `PUT /:id` |
| `src/api/client.ts` | + `updateTrade()` |
| `src/components/portfolio/TradeModal.tsx` | + `editTrade` prop, режим редактирования |
| `src/components/portfolio/TradesListModal.tsx` | + Pencil кнопка, стейт `editingTrade` |
