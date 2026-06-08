import { usePortfolio } from './hooks/usePortfolio'

/**
 * Временная корневая страница на время инициализации проекта.
 * Структуру и компоненты главной страницы (см. CLAUDE.md «Структура интерфейса»)
 * реализует Claude Design в src/pages и src/components — этот файл лишь
 * проверяет сквозную связку frontend → backend → БД.
 */
export function App() {
  const { apiStatus, isLoading, error } = usePortfolio()

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>InvestAnalitic</h1>
      <p>Инвестиционный портфельный ассистент — каркас проекта инициализирован.</p>
      <section>
        <h2>Статус API</h2>
        {isLoading && <p>Проверка подключения к серверу…</p>}
        {error && <p style={{ color: 'crimson' }}>Ошибка: {error}</p>}
        {apiStatus && (
          <ul>
            <li>Статус: {apiStatus.status}</li>
            <li>База данных: {apiStatus.db}</li>
            <li>Время: {apiStatus.timestamp}</li>
          </ul>
        )}
      </section>
    </main>
  )
}
