# Архитектура и зоны ответственности

Каркас проекта создан согласно `CLAUDE.md`. Документ фиксирует принятые решения,
чтобы синхронизировать эту сессию и Claude Design.

## Стек

| Слой | Технология |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Состояние | Zustand (`src/store`) |
| Backend | Node.js + Express + TypeScript |
| БД | PostgreSQL (`pg`), миграции — `node-pg-migrate` |
| Локальная БД | Docker Compose (`docker-compose.yml`, сервис `postgres`) |
| Тесты | Vitest |

## Структура

```
src/
├── components/  ← Claude Design (UI, только props)
├── pages/       ← Claude Design (роутинг, структура страниц)
├── styles/      ← Claude Design
├── theme/       ← Claude Design
├── assets/      ← Claude Design
├── types/       ← общая зона: контракт между frontend и backend
├── hooks/       ← эта сессия: usePortfolio и др.
├── store/       ← эта сессия: Zustand store
├── api/         ← эта сессия: HTTP-клиент к backend
└── utils/       ← эта сессия: форматирование, финансовые утилиты

server/
├── src/routes/       ← маршруты Express
├── src/controllers/  ← обработчики запросов
├── src/services/     ← финансовые расчёты, бизнес-логика
├── src/db/           ← подключение к Postgres
└── migrations/       ← node-pg-migrate (accounts, positions, trades, payments)
```

## Доменная модель (`src/types`)

`Account`, `Position` (`EquityPosition` / `BondPosition`), `Trade`, `Payment` —
типы соответствуют разделу «Данные, с которыми ты работаешь» в `CLAUDE.md` и
зеркалят схему таблиц БД (`accounts`, `positions`, `trades`, `payments`).
Денежные поля в БД — `numeric`, не `float` (точность расчётов из CLAUDE.md).

## Запуск локально

1. `docker compose up -d` — поднять Postgres
2. Скопировать `.env.example` → `server/.env`, при необходимости поправить `DATABASE_URL`
3. `npm install` в корне и в `server/`
4. `npm run migrate --prefix server` — применить миграции
5. `npm run dev` в корне — запустит фронтенд (Vite, :5173) и бэкенд (:4000) параллельно

Фронтенд проксирует `/api/*` на `http://localhost:4000` (см. `vite.config.ts`).
Корневая страница `App.tsx` — временная: она проверяет связку
frontend → backend → БД через `GET /api/health`. Реальный UI главной страницы
(иерархия «Портфель → Счёт → Акции/Облигации/Кэш», см. CLAUDE.md «Структура
интерфейса») реализуется Claude Design в `src/pages` и `src/components`.

## Что дальше

- Claude Design: реализовать компоненты и страницы по иерархии из CLAUDE.md,
  потребляя данные через хуки (`usePortfolio` и последующие).
- Эта сессия: реализовать реальные эндпоинты CRUD для accounts/positions/trades/
  payments, расчёт P&L, ребалансировку — согласно CLAUDE.md «Функции, которые ты
  выполняешь».
