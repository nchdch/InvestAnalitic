import { usePortfolio } from './hooks/usePortfolio'

// Временная заглушка — Claude Design заменит этот файл на src/pages/PortfolioPage
export function App() {
  const { summary, accounts, isLoading, error } = usePortfolio()

  if (isLoading) return <p style={{ padding: 24 }}>Загрузка…</p>
  if (error) return <p style={{ padding: 24, color: 'crimson' }}>Ошибка: {error}</p>

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>InvestAnalitic</h1>
      {summary && (
        <p>Портфель: {summary.totalValue.toLocaleString('ru-RU')} ₽ · P&L: +{summary.unrealizedPnlPercent}%</p>
      )}
      {accounts.map((acc) => (
        <section key={acc.id}>
          <h2>{acc.name} ({acc.broker})</h2>
          <p>{acc.totalValue.toLocaleString('ru-RU')} ₽ · {acc.equityRows.length} акций · {acc.bondRows.length} облигаций</p>
        </section>
      ))}
    </main>
  )
}
