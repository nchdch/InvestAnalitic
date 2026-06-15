import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, ShieldCheck, ShieldAlert, Sparkles, Layers, Wallet, TrendingUp, CheckCircle2, Users, Plus } from 'lucide-react'
import { Card, Button, Input, Select, Switch, Avatar, Badge, StatCard } from '../components'
import type { BadgeTone } from '../components'
import type { Organization } from '@/types'
import { OrgMembersModal } from '../components/portfolio/OrgMembersModal'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { useThemeStore } from '../store/themeStore'
import { useSettingsStore } from '../store/settingsStore'
import type { TaxLotMethod } from '../store/settingsStore'
import { usePortfolio } from '../hooks/usePortfolio'
import { changePassword, logoutUser } from '../api/auth'
import { formatRub } from '../utils/format'

const PCT2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ROLE_LABEL: Record<Organization['role'], string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  member: 'Участник',
}

const ROLE_TONE: Record<Organization['role'], BadgeTone> = {
  owner: 'accent',
  admin: 'ai',
  member: 'neutral',
}

const TAX_LOT_OPTIONS = [
  { value: 'FIFO', label: 'FIFO — первым купил, первым продал' },
  { value: 'LIFO', label: 'LIFO — последним купил, первым продал' },
]

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const clearOrgs = useOrgStore((s) => s.clearOrgs)
  const orgs = useOrgStore((s) => s.orgs)
  const navigate = useNavigate()
  const [orgModal, setOrgModal] = useState<Organization | null>(null)

  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const rebalanceThreshold = useSettingsStore((s) => s.rebalanceThreshold)
  const setRebalanceThreshold = useSettingsStore((s) => s.setRebalanceThreshold)
  const concentrationThreshold = useSettingsStore((s) => s.concentrationThreshold)
  const setConcentrationThreshold = useSettingsStore((s) => s.setConcentrationThreshold)
  const sectorConcentrationThreshold = useSettingsStore((s) => s.sectorConcentrationThreshold)
  const setSectorConcentrationThreshold = useSettingsStore((s) => s.setSectorConcentrationThreshold)
  const taxLotMethod = useSettingsStore((s) => s.taxLotMethod)
  const setTaxLotMethod = useSettingsStore((s) => s.setTaxLotMethod)

  const { summary, accounts } = usePortfolio()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Пользователь'
  const positionsCount = accounts.reduce((s, a) => s + a.equityRows.length + a.bondRows.length, 0)

  const handleLogout = async () => {
    await logoutUser().catch(() => {})
    clearAuth()
    clearOrgs()
    navigate('/auth', { replace: true })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword.length < 8) {
      setPwError('Новый пароль должен содержать не менее 8 символов')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Пароли не совпадают')
      return
    }

    setPwLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Не удалось сменить пароль')
    } finally {
      setPwLoading(false)
    }
  }

  const handleThresholdChange = (setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!Number.isNaN(v)) setter(v)
  }

  return (
    <div className="ia-screen">
      <div className="ia-grid-top">
        <Card>
          <div className="ia-profile-head">
            <Avatar name={displayName} shape="circle" size="lg" color="var(--ink-600)" />
            <div className="ia-profile-head__info">
              <div className="ia-profile-head__name">{displayName}</div>
              <div className="ia-profile-head__email">{user?.email}</div>
              <div style={{ marginTop: 8 }}>
                {user?.emailVerified ? (
                  <Badge tone="positive" size="sm" icon={<ShieldCheck size={12} />}>Email подтверждён</Badge>
                ) : (
                  <Badge tone="warning" size="sm" icon={<ShieldAlert size={12} />}>Email не подтверждён</Badge>
                )}
              </div>
            </div>
            <Button variant="secondary" leftIcon={<LogOut size={16} />} onClick={handleLogout}>Выйти</Button>
          </div>
        </Card>

        <Card title="Ваш ИИ-ассистент" subtitle="Чем я занимаюсь в фоне">
          <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
            Слежу за котировками и параметрами облигаций через MOEX, пересчитываю P&amp;L
            и держу в курсе важных событий — выплат, погашений и отклонений от целевых
            весов. Чем больше сделок вы вносите, тем точнее становится анализ.
          </p>
          <div className="ia-stats-grid">
            <StatCard label="Портфелей" value={accounts.length} icon={<Layers size={15} />} />
            <StatCard label="Позиций отслеживается" value={positionsCount} icon={<Wallet size={15} />} />
            <StatCard label="Стоимость портфеля" value={summary ? formatRub(summary.totalValue) : '—'} icon={<TrendingUp size={15} />} />
            <StatCard
              label="Форвардная доходность"
              value={summary?.forwardDividendYield != null ? PCT2.format(summary.forwardDividendYield) : '—'}
              unit={summary?.forwardDividendYield != null ? '%' : undefined}
              icon={<Sparkles size={15} />}
            />
          </div>
        </Card>
      </div>

      <div className="ia-grid-top">
        <Card title="Смена пароля" subtitle="Регулярно обновляйте пароль для безопасности аккаунта">
          <form onSubmit={handleChangePassword} className="ia-profile-form">
            <Input
              label="Текущий пароль"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="Новый пароль"
              type="password"
              required
              autoComplete="new-password"
              hint="Не менее 8 символов"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Повторите новый пароль"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {pwError && <div className="ia-profile-msg ia-profile-msg--err">{pwError}</div>}
            {pwSuccess && (
              <div className="ia-profile-msg ia-profile-msg--ok">
                <CheckCircle2 size={14} /> Пароль успешно изменён
              </div>
            )}
            <Button type="submit" leftIcon={<KeyRound size={16} />} loading={pwLoading}>
              Сменить пароль
            </Button>
          </form>
        </Card>

        <Card title="Настройки" subtitle="Внешний вид и пороги для проактивных уведомлений">
          <div className="ia-profile-section">
            <div className="ia-profile-row">
              <div>
                <div className="ia-profile-row__title">Тёмная тема</div>
                <div className="ia-profile-row__sub">Переключить оформление интерфейса</div>
              </div>
              <Switch checked={theme === 'dark'} onChange={toggleTheme} aria-label="Тёмная тема" />
            </div>
          </div>

          <div className="ia-profile-section">
            <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Пороги ИИ-ассистента</div>
            <div className="ia-profile-thresholds">
              <Input
                label="Отклонение для ребалансировки"
                type="number"
                numeric
                min={0}
                max={100}
                step={0.5}
                suffix="%"
                value={rebalanceThreshold}
                onChange={handleThresholdChange(setRebalanceThreshold)}
                hint="Сигнал, если позиция отклонилась от цели больше, чем на это значение"
              />
              <Input
                label="Концентрация одной бумаги"
                type="number"
                numeric
                min={0}
                max={100}
                step={1}
                suffix="%"
                value={concentrationThreshold}
                onChange={handleThresholdChange(setConcentrationThreshold)}
                hint="Предупреждение о высокой доле одного эмитента"
              />
              <Input
                label="Концентрация сектора"
                type="number"
                numeric
                min={0}
                max={100}
                step={1}
                suffix="%"
                value={sectorConcentrationThreshold}
                onChange={handleThresholdChange(setSectorConcentrationThreshold)}
                hint="Предупреждение о высокой доле одного сектора"
              />
            </div>
          </div>

          <div className="ia-profile-section">
            <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Налоговый учёт</div>
            <Select
              label="Метод списания лотов (FIFO/LIFO)"
              options={TAX_LOT_OPTIONS}
              value={taxLotMethod}
              onChange={(e) => setTaxLotMethod(e.target.value as TaxLotMethod)}
            />
            <div className="ia-profile-row__sub" style={{ marginTop: 6 }}>
              Определяет, какие лоты считаются проданными первыми при расчёте реализованного P&amp;L и НДФЛ
            </div>
          </div>
        </Card>
      </div>

      <Card title="Организации" subtitle="Компании, в которых вы состоите, и ваша роль в каждой">
        {orgs.map((org) => (
          <div key={org.id} className="ia-org-row">
            <div>
              <div style={{ fontWeight: 600 }}>{org.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>ИНН {org.inn}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge tone={ROLE_TONE[org.role]} size="sm">{ROLE_LABEL[org.role]}</Badge>
              {org.status === 'pending' && <Badge tone="warning" size="sm" dot>На рассмотрении</Badge>}
              {org.status === 'active' && (org.role === 'owner' || org.role === 'admin') && (
                <Button size="sm" variant="secondary" leftIcon={<Users size={14} />} onClick={() => setOrgModal(org)}>
                  Участники
                </Button>
              )}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <Button variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate('/org-setup')}>
            Добавить организацию
          </Button>
        </div>
      </Card>

      <OrgMembersModal open={!!orgModal} onClose={() => setOrgModal(null)} org={orgModal} />
    </div>
  )
}
