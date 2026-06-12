import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthPage } from './pages/AuthPage'
import { EmailVerifyPage } from './pages/EmailVerifyPage'
import { GoogleCallbackPage } from './pages/GoogleCallbackPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { OrgSetupPage } from './pages/OrgSetupPage'
import { AppShell, type PageId } from './pages/AppShell'
import { PortfolioPage } from './pages/PortfolioPage'
import { AssistantPage } from './pages/AssistantPage'
import { RebalancePage } from './pages/RebalancePage'
import { CalendarPage } from './pages/CalendarPage'
import { TradeHistoryPage } from './pages/TradeHistoryPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ProfilePage } from './pages/ProfilePage'
import { TradeModal } from './components/portfolio/TradeModal'
import { PortfolioModal } from './components/portfolio/PortfolioModal'
import { DepositModal } from './components/portfolio/DepositModal'
import { ImportModal } from './components/portfolio/ImportModal'
import { useAuthStore } from './store/authStore'
import { useOrgStore, getSavedOrgId } from './store/orgStore'
import { refreshSession } from './api/auth'
import { listOrgs } from './api/orgs'

function AppLayout() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [tradeOpen, setTradeOpen] = useState(false)
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const { orgs, activeOrg, isLoading: orgLoading, setActiveOrg } = useOrgStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (orgLoading) return
    const activeOrgs = orgs.filter((o) => o.status === 'active')
    if (activeOrgs.length === 0) {
      navigate('/org-setup', { replace: true })
    } else if (!activeOrg) {
      setActiveOrg(activeOrgs[0])
    }
  }, [orgLoading, orgs, activeOrg, navigate, setActiveOrg])

  if (orgLoading) return (
    <div className="ia-auth-wrap">
      <div style={{ color: 'var(--text-3)' }}>Загрузка…</div>
    </div>
  )
  if (!activeOrg) return null

  return (
    <>
      <AppShell
        page={page}
        onNav={setPage}
        onAddTrade={() => setTradeOpen(true)}
        onAddPortfolio={() => setPortfolioOpen(true)}
        onAddDeposit={() => setDepositOpen(true)}
        onImportTrades={() => setImportOpen(true)}
      >
        {page === 'dashboard' && <PortfolioPage />}
        {page === 'assistant' && <AssistantPage />}
        {page === 'rebalance' && <RebalancePage />}
        {page === 'calendar' && <CalendarPage />}
        {page === 'trades' && <TradeHistoryPage />}
        {page === 'analytics' && <AnalyticsPage />}
        {page === 'profile' && <ProfilePage />}
      </AppShell>
      <TradeModal open={tradeOpen} onClose={() => setTradeOpen(false)} />
      <PortfolioModal open={portfolioOpen} onClose={() => setPortfolioOpen(false)} />
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div className="ia-auth-wrap"><div style={{ color: 'var(--text-3)' }}>Загрузка…</div></div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div className="ia-auth-wrap"><div style={{ color: 'var(--text-3)' }}>Загрузка…</div></div>
  return <Navigate to={user ? '/app' : '/auth'} replace />
}

export function App() {
  const { setAuth, clearAuth, setLoading } = useAuthStore()
  const { setOrgs, setActiveOrg, clearOrgs, setLoading: setOrgLoading } = useOrgStore()

  useEffect(() => {
    setLoading(true)
    refreshSession()
      .then(async (r) => {
        setAuth(r.user, r.accessToken)
        setOrgLoading(true)
        try {
          const orgs = await listOrgs()
          setOrgs(orgs)
          const active = orgs.filter((o) => o.status === 'active')
          const savedId = getSavedOrgId()
          const saved = active.find((o) => o.id === savedId)
          setActiveOrg(saved ?? active[0] ?? null)
        } catch {
          setActiveOrg(null)
        } finally {
          setOrgLoading(false)
        }
      })
      .catch(() => {
        clearAuth()
        clearOrgs()
      })
  }, [setAuth, clearAuth, setLoading, setOrgs, setActiveOrg, clearOrgs, setOrgLoading])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/verify" element={<EmailVerifyPage />} />
        <Route path="/auth/callback" element={<GoogleCallbackPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/org-setup" element={<ProtectedRoute><OrgSetupPage /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
