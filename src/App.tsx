import { useState } from 'react'
import { LandingPage } from './pages/LandingPage'
import { AppShell, type PageId } from './pages/AppShell'
import { PortfolioPage } from './pages/PortfolioPage'
import { AssistantPage } from './pages/AssistantPage'
import { RebalancePage } from './pages/RebalancePage'
import { CalendarPage } from './pages/CalendarPage'
import { TradeModal } from './components/portfolio/TradeModal'

export function App() {
  const [inApp, setInApp] = useState(false)
  const [page, setPage] = useState<PageId>('dashboard')
  const [tradeOpen, setTradeOpen] = useState(false)

  if (!inApp) {
    return <LandingPage onStart={() => setInApp(true)} />
  }

  return (
    <>
      <AppShell page={page} onNav={setPage} onAddTrade={() => setTradeOpen(true)}>
        {page === 'dashboard' && <PortfolioPage />}
        {page === 'assistant' && <AssistantPage />}
        {page === 'rebalance' && <RebalancePage />}
        {page === 'calendar' && <CalendarPage />}
      </AppShell>
      <TradeModal open={tradeOpen} onClose={() => setTradeOpen(false)} />
    </>
  )
}
