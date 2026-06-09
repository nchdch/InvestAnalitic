import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button, Input } from '../components'
import { useAuthStore } from '../store/authStore'
import { loginUser, registerUser, getGoogleOAuthUrl } from '../api/auth'
import logoMark from '../assets/logo-mark.svg'

type Tab = 'login' | 'register'

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const err = params.get('error')
    if (err) setError(decodeURIComponent(err))
  }, [params])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (tab === 'login') {
        const r = await loginUser(email, password)
        setAuth(r.user, r.accessToken)
        navigate('/app', { replace: true })
      } else {
        const r = await registerUser(email, password, name || undefined)
        setAuth(r.user, r.accessToken)
        setInfo('Письмо с подтверждением отправлено на ' + email)
        setTimeout(() => navigate('/app', { replace: true }), 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ia-auth-wrap">
      <div className="ia-auth-card">
        <div className="ia-auth-brand">
          <img src={logoMark} width={36} height={36} alt="" />
          <span>Invest<b>Analitic</b></span>
        </div>

        <div className="ia-auth-tabs">
          <button className={'ia-auth-tab' + (tab === 'login' ? ' is-active' : '')} onClick={() => setTab('login')}>
            Войти
          </button>
          <button className={'ia-auth-tab' + (tab === 'register' ? ' is-active' : '')} onClick={() => setTab('register')}>
            Регистрация
          </button>
        </div>

        <form onSubmit={submit} className="ia-auth-form">
          {tab === 'register' && (
            <Input
              label="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              autoComplete="name"
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tab === 'register' ? 'Минимум 8 символов' : ''}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {error && <div className="ia-auth-error">{error}</div>}
          {info && <div className="ia-auth-info">{info}</div>}

          <Button type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Загрузка…' : tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>

          {tab === 'login' && (
            <div style={{ textAlign: 'center' }}>
              <Link to="/auth/forgot-password" className="ia-auth-link">Забыли пароль?</Link>
            </div>
          )}

          <div className="ia-auth-divider"><span>или</span></div>

          <a href={getGoogleOAuthUrl()} className="ia-auth-google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Войти через Google
          </a>
        </form>
      </div>
    </div>
  )
}
