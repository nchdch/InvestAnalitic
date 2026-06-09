import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
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
import { TradeModal } from './components/portfolio/TradeModal'
import { useAuthStore } from './store/authStore'
import { useOrgStore, getSavedOrgId } from './store/orgStore'
import { refreshSession } from './api/auth'
import { listOrgs } from './api/orgs'

function AppLayout() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [tradeOpen, setTradeOpen] = useState(false)
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div className="ia-auth-wrap"><div style={{ color: 'var(--text-3)' }}>Загрузка…</div></div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
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
        <Route path="/" element={<LandingPage onStart={() => window.location.href = '/auth'} />} />
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
