import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { refreshSession } from '../api/auth'

export function GoogleCallbackPage() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    const token = new URLSearchParams(hash.slice(1)).get('token')

    if (token) {
      // Refresh to get full user object (access token was set in server cookie already)
      refreshSession()
        .then((r) => {
          setAuth(r.user, r.accessToken)
          navigate('/app', { replace: true })
        })
        .catch(() => navigate('/auth?error=Ошибка%20входа%20через%20Google', { replace: true }))
    } else {
      // No token means Google didn't redirect here properly — go back to auth
      navigate('/auth', { replace: true })
    }
  }, [navigate, setAuth])

  return (
    <div className="ia-auth-wrap">
      <div className="ia-auth-card" style={{ textAlign: 'center' }}>
        <p>Завершаем вход через Google…</p>
      </div>
    </div>
  )
}
