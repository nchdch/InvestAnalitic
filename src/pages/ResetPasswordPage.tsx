import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../components'
import { resetPassword } from '../api/auth'
import logoMark from '../assets/logo-mark.svg'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const token = params.get('token') ?? ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    if (password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return }
    setError('')
    setBusy(true)
    try {
      await resetPassword(token, password)
      navigate('/auth?info=Пароль успешно изменён', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сброса пароля')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="ia-auth-wrap">
        <div className="ia-auth-card" style={{ textAlign: 'center' }}>
          <p>Ссылка недействительна. <Link to="/auth/forgot-password" className="ia-auth-link">Запросить новую</Link></p>
        </div>
      </div>
    )
  }

  return (
    <div className="ia-auth-wrap">
      <div className="ia-auth-card">
        <div className="ia-auth-brand">
          <img src={logoMark} width={36} height={36} alt="" />
          <span>Invest<b>Analitic</b></span>
        </div>
        <form onSubmit={submit} className="ia-auth-form">
          <h3 style={{ margin: 0 }}>Новый пароль</h3>
          <Input label="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 8 символов" required />
          <Input label="Повторите пароль" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {error && <div className="ia-auth-error">{error}</div>}
          <Button type="submit" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить пароль'}</Button>
        </form>
      </div>
    </div>
  )
}
