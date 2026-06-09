import { useState } from 'react'
import { LandingPage } from './pages/LandingPage'
import { AppShell, type PageId } from './pages/AppShell'
import { PortfolioPage } from './pages/PortfolioPage'
import { AssistantPage } from './pages/AssistantPage'
import { RebalancePage } from './pages/RebalancePage'
import { CalendarPage } from './pages/CalendarPage'

export function App() {
  const [inApp, setInApp] = useState(false)
  const [page, setPage] = useState<PageId>('dashboard')

  if (!inApp) {
    return <LandingPage onStart={() => setInApp(true)} />
  }

  return (
    <AppShell page={page} onNav={setPage}>
      {page === 'dashboard' && <PortfolioPage />}
      {page === 'assistant' && <AssistantPage />}
      {page === 'rebalance' && <RebalancePage />}
      {page === 'calendar' && <CalendarPage />}
    </AppShell>
  )
}
