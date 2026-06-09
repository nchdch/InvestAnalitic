import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../api/auth'

type State = 'loading' | 'success' | 'error'

export function EmailVerifyPage() {
  const [params] = useSearchParams()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setState('error'); setErrorMsg('Ссылка недействительна'); return }

    verifyEmail(token)
      .then(() => setState('success'))
      .catch((err: unknown) => {
        setState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Ошибка')
      })
  }, [params])

  return (
    <div className="ia-auth-wrap">
      <div className="ia-auth-card" style={{ textAlign: 'center', gap: 16 }}>
        {state === 'loading' && <p>Проверяем ссылку…</p>}
        {state === 'success' && (
          <>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2>Email подтверждён!</h2>
            <p style={{ color: 'var(--text-3)' }}>Теперь вы можете пользоваться всеми функциями сервиса.</p>
            <Link to="/app" className="ia-auth-link" style={{ fontWeight: 600 }}>Перейти в портфель →</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <div style={{ fontSize: 48 }}>❌</div>
            <h2>Не удалось подтвердить</h2>
            <p style={{ color: 'var(--text-3)' }}>{errorMsg}</p>
            <Link to="/auth" className="ia-auth-link">Вернуться к входу</Link>
          </>
        )}
      </div>
    </div>
  )
}
