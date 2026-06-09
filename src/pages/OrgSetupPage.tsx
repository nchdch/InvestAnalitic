import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, Badge } from '../components'
import { lookupInn, createOrJoinOrg, listOrgs } from '../api/orgs'
import type { OrgInfo, Organization } from '@/types'
import { Building2, Search, CheckCircle, Clock } from 'lucide-react'
import { useOrgStore } from '../store/orgStore'

type Step = 'list' | 'search' | 'confirm' | 'done'

export function OrgSetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('list')
  const [inn, setInn] = useState('')
  const [lookupResult, setLookupResult] = useState<OrgInfo | null>(null)
  const [myOrgs, setMyOrgs] = useState<Organization[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [joinResult, setJoinResult] = useState<{ isNew: boolean; status: string } | null>(null)
  const { setOrgs: setOrgStoreOrgs, setActiveOrg, activeOrg } = useOrgStore()

  useEffect(() => {
    listOrgs().then(setMyOrgs).catch(() => {})
  }, [])

  async function handleLookup() {
    setError('')
    setBusy(true)
    try {
      const info = await lookupInn(inn.trim())
      setLookupResult(info)
      setStep('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Организация не найдена')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirm() {
    if (!lookupResult) return
    setError('')
    setBusy(true)
    try {
      const res = await createOrJoinOrg(lookupResult.inn)
      setJoinResult({ isNew: res.isNew, status: (res.membership as { status: string }).status })
      setStep('done')
      const updated = await listOrgs().catch(() => [] as Organization[])
      setMyOrgs(updated)
      setOrgStoreOrgs(updated)
      if (res.isNew && !activeOrg) {
        const newOrg = updated.find((o) => o.inn === lookupResult!.inn && o.status === 'active')
        if (newOrg) setActiveOrg(newOrg)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ia-auth-wrap" style={{ alignItems: 'flex-start', paddingTop: 48 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div className="ia-auth-brand" style={{ marginBottom: 24 }}>
          <Building2 size={28} />
          <span style={{ fontSize: 20, fontWeight: 700 }}>Организации</span>
        </div>

        {myOrgs.length > 0 && step === 'list' && (
          <Card style={{ marginBottom: 24 }}>
            <div className="ia-eyebrow" style={{ marginBottom: 12 }}>Ваши организации</div>
            {myOrgs.map((org) => (
              <div key={org.id} className="ia-org-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{org.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>ИНН {org.inn}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge tone={org.status === 'active' ? 'positive' : 'warning'} size="sm">
                    {org.role === 'owner' ? 'Владелец' : org.role === 'admin' ? 'Администратор' : 'Участник'}
                  </Badge>
                  {org.status === 'pending' && (
                    <Badge tone="warning" size="sm" dot>На рассмотрении</Badge>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}

        {step === 'list' && (
          <Card>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Building2 size={40} strokeWidth={1.2} color="var(--text-4)" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Добавить организацию</div>
              <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', marginBottom: 20 }}>
                Введите ИНН — данные подтянутся автоматически из реестра ФНС
              </div>
              <Button leftIcon={<Search size={16} />} onClick={() => setStep('search')}>
                Найти по ИНН
              </Button>
            </div>
          </Card>
        )}

        {step === 'search' && (
          <Card>
            <div className="ia-eyebrow" style={{ marginBottom: 16 }}>Поиск организации</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                placeholder="ИНН (10 или 12 цифр)"
                style={{ flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
              <Button onClick={handleLookup} disabled={busy || inn.length < 10}>
                {busy ? '…' : 'Найти'}
              </Button>
            </div>
            {error && <div className="ia-auth-error" style={{ marginTop: 8 }}>{error}</div>}
            <div style={{ marginTop: 12 }}>
              <button className="ia-auth-link" onClick={() => setStep('list')}>← Назад</button>
            </div>
          </Card>
        )}

        {step === 'confirm' && lookupResult && (
          <Card>
            <div className="ia-eyebrow" style={{ marginBottom: 16 }}>Подтвердите организацию</div>
            <div className="ia-org-info">
              <div className="ia-org-info__row">
                <span>Название</span><strong>{lookupResult.name}</strong>
              </div>
              <div className="ia-org-info__row">
                <span>Полное название</span><span>{lookupResult.fullName}</span>
              </div>
              <div className="ia-org-info__row">
                <span>ИНН</span><span className="ia-mono">{lookupResult.inn}</span>
              </div>
              {lookupResult.kpp && (
                <div className="ia-org-info__row">
                  <span>КПП</span><span className="ia-mono">{lookupResult.kpp}</span>
                </div>
              )}
              {lookupResult.ogrn && (
                <div className="ia-org-info__row">
                  <span>ОГРН</span><span className="ia-mono">{lookupResult.ogrn}</span>
                </div>
              )}
              {lookupResult.address && (
                <div className="ia-org-info__row">
                  <span>Адрес</span><span>{lookupResult.address}</span>
                </div>
              )}
            </div>
            {error && <div className="ia-auth-error" style={{ marginTop: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <Button onClick={handleConfirm} disabled={busy}>
                {busy ? 'Загрузка…' : 'Добавить'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('search')}>Назад</Button>
            </div>
          </Card>
        )}

        {step === 'done' && joinResult && (
          <Card style={{ textAlign: 'center', padding: '32px 24px' }}>
            {joinResult.isNew ? (
              <>
                <CheckCircle size={48} color="var(--pnl-up)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                <h3>Организация добавлена</h3>
                <p style={{ color: 'var(--text-3)' }}>Вы стали владельцем. Можете пригласить коллег через управление участниками.</p>
              </>
            ) : (
              <>
                <Clock size={48} color="var(--tone-warning)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                <h3>Заявка отправлена</h3>
                <p style={{ color: 'var(--text-3)' }}>
                  Администратор организации получил уведомление. Вы получите доступ после одобрения.
                </p>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              <Button onClick={() => navigate('/app')}>Перейти в портфель</Button>
              <Button variant="ghost" onClick={() => { setStep('search'); setInn(''); setLookupResult(null) }}>
                Добавить ещё
              </Button>
            </div>
          </Card>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="ia-auth-link" onClick={() => navigate('/app')}>
            Пропустить — работать без организации
          </button>
        </div>
      </div>
    </div>
  )
}
