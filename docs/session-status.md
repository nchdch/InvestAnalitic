# Статус сессии — 2026-06-08

Сводка перед перезапуском чата/сессии: что сделано, что в работе, что заблокировано.

## 1. Инициализация проекта — завершена (Фазы 0–5)

Каркас приложения InvestAnalitic (React + Vite frontend / Express + TS backend /
PostgreSQL) полностью создан и проверен:

- Структура папок и зоны ответственности — см. `docs/architecture.md`
- Общие типы домена — `src/types/` (Account, Position, Trade, Payment)
- Backend-скелет — `server/` (Express, контроллер `/api/health`, пул подключений к Postgres)
- Миграции БД — `server/migrations/` (accounts, positions, trades, payments)
- Frontend-скелет — `src/` (Zustand store, `usePortfolio`, API-клиент, форматтеры)
- `docker-compose.yml` — Postgres 16 для локальной разработки

**Smoke-тест пройден полностью:**
- Backend `:4000` — `/api/health` корректно отвечает (`degraded`/`unavailable`,
  т.к. локально нет Postgres — это штатное поведение graceful degradation)
- Frontend `:5174` — отдаёт SPA (200, корректный `<title>`), проксирует `/api/*` на backend
- Type-check (`tsc -b --noEmit` для root и server) — чисто
- ESLint — чисто

## 2. Важные системные изменения (сохраняются за пределами сессии!)

Из-за переполнения диска **C:** (0 ГБ свободно) временные каталоги перенесены на **D:**:
- User-переменные окружения `TEMP` / `TMP` → `D:\tmp`
- Глобальный кеш npm (`npm config --global cache`) → `D:\npm-cache`

Учитывайте это при дальнейшей работе с npm/node на этой машине.

## 3. Деплой на сервер — в процессе, заблокирован на сетевом уровне

**Цель:** полноценный продакшн-деплой на свежую VM.

**VM:** изначально `10.3.0.23`, затем адрес сменился на **`10.3.0.47`**
(подсеть `10.3.0.0/24`), логин `vrtadmin`.

⚠️ **Пароль был передан в чате открытым текстом — после восстановления SSH-доступа
обязательно смените его на сервере (`passwd`).**

**Подготовлен SSH-ключ для деплоя** (ed25519, без passphrase):
- Приватный: `~/.ssh/investanalitic_deploy`
- Публичный: `~/.ssh/investanalitic_deploy.pub`
- Установить публичный ключ в `~/.ssh/authorized_keys` на VM пока не удалось —
  блокируется на сетевом уровне (см. ниже)

**Текущий блокер — SSH не проходит ни с одного адреса VM:**

И на `10.3.0.23`, и на `10.3.0.47` наблюдается одинаковая картина:
- TCP-порт 22 отвечает на handshake («открыт»)
- SSH-баннер (`SSH-2.0-...`) от сервера НЕ приходит вообще — ни байта
- Соединение сразу разрывается (`kex_exchange_identification: Connection closed
  by remote host`)

То, что симптом идентичен на двух разных IP подряд, указывает скорее не на бан
конкретного адреса (fail2ban снят пользователем — не помогло), а на:
1. Блокировку трафика **между подсетями** `10.77.251.0/24` (эта машина) и
   `10.3.0.0/24` (VM) — на роутере/гипервизоре/файрволе между ними, либо
2. Правило на самой VM, блокирующее **весь диапазон нашей подсети** (а не
   конкретный старый IP) — через TCP Wrappers (`/etc/hosts.deny`) или
   firewall-правило с маской подсети.

**Что нужно проверить через консоль VM:**
```bash
sudo cat /etc/hosts.allow /etc/hosts.deny
sudo iptables -L -n -v | head -50
sudo ufw status numbered
sudo grep -iE "ListenAddress|AllowUsers|AllowGroups|Match Address|DenyUsers" /etc/ssh/sshd_config
```
А также проверить связность между подсетями в принципе (ping/traceroute в обе стороны:
эта машина имеет адрес `10.77.251.41`).

## 4. Локальный публичный SSH-ключ для установки на VM

Когда сетевой блокер снят, нужно будет добавить этот ключ в
`~/.ssh/authorized_keys` пользователя `vrtadmin` на VM:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMu6iYSKrfCEp6rYYOPKtA3KKyzWnYOEN9ngB90kTxDi investanalitic-deploy
```

## 5. Что дальше (после восстановления SSH-доступа)

1. Установить публичный ключ в `authorized_keys`, перейти на ключевую аутентификацию
2. Сменить пароль пользователя `vrtadmin` на VM (был передан в чате открытым текстом)
3. Развернуть продакшн-стек: Docker Compose (frontend build → nginx static, backend,
   postgres, nginx reverse proxy + Let's Encrypt TLS)
4. Настроить переменные окружения / секреты (`.env`, не в git)
5. Прогнать миграции БД (`npm run migrate --prefix server`)
6. Настроить healthcheck и перезапуск при сбое

## 6. Прочее

- Проект пока **не инициализирован как git-репозиторий** — стоит сделать перед
  деплоем (нужен для CI/CD и версионирования)
- Docker и PostgreSQL **не установлены локально** на машине разработки — поэтому
  локальный backend всегда отвечает `degraded`/`db: unavailable`
