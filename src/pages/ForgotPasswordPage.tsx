import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../components'
import { forgotPassword } from '../api/auth'
import logoMark from '../assets/logo-mark.svg'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await forgotPassword(email).catch(() => {})
    setSent(true)
    setBusy(false)
  }

  return (
    <div className="ia-auth-wrap">
      <div className="ia-auth-card">
        <div className="ia-auth-brand">
          <img src={logoMark} width={36} height={36} alt="" />
          <span>Invest<b>Analitic</b></span>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <h3>Письмо отправлено</h3>
            <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
              Если аккаунт с этим email существует, ссылка для сброса придёт в течение минуты.
            </p>
            <Link to="/auth" className="ia-auth-link" style={{ display: 'block', marginTop: 16 }}>← Вернуться к входу</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="ia-auth-form">
            <h3 style={{ margin: 0 }}>Восстановление пароля</h3>
            <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', margin: 0 }}>
              Введите email — пришлём ссылку для сброса.
            </p>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" disabled={busy}>{busy ? 'Отправляем…' : 'Отправить ссылку'}</Button>
            <div style={{ textAlign: 'center' }}>
              <Link to="/auth" className="ia-auth-link">← Назад к входу</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
