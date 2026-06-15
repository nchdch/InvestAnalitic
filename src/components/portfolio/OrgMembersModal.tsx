import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { X, Check, Mail } from 'lucide-react'
import { Avatar, Badge, Button, Input, Select } from '../index'
import type { BadgeTone } from '../index'
import type { OrgMember, Organization } from '@/types'
import { approveMember, getOrgMembers, inviteMember, rejectMember, updateMemberRole } from '../../api/orgs'
import { injectOnce } from '../_internal/style'
import { MODAL_CSS } from './modalShared'

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

const ROLE_OPTIONS = [
  { value: 'member', label: 'Участник' },
  { value: 'admin', label: 'Администратор' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU')
}

interface Props {
  open: boolean
  onClose: () => void
  org: Organization | null
}

export function OrgMembersModal({ open, onClose, org }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const orgId = org?.id

  const load = useCallback(() => {
    if (!orgId) return
    setLoading(true)
    setError('')
    getOrgMembers(orgId)
      .then(setMembers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [orgId])

  useEffect(() => {
    if (!open || !orgId) return
    setInviteEmail('')
    setInviteMsg(null)
    load()
  }, [open, orgId, load])

  if (!open || !org) return null

  const isOwner = org.role === 'owner'
  const canManage = org.role === 'owner' || org.role === 'admin'
  const pending = members.filter((m) => m.status === 'pending')
  const active = members.filter((m) => m.status === 'active')

  async function handleApprove(membershipId: string) {
    setBusyId(membershipId)
    try {
      await approveMember(org!.id, membershipId)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusyId(null)
    }
  }

  async function handleReject(membershipId: string) {
    setBusyId(membershipId)
    try {
      await rejectMember(org!.id, membershipId)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusyId(null)
    }
  }

  async function handleRoleChange(membershipId: string, role: 'admin' | 'member') {
    setBusyId(membershipId)
    try {
      await updateMemberRole(org!.id, membershipId, role)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusyId(null)
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    setInviteMsg(null)
    const email = inviteEmail.trim()
    setInviteBusy(true)
    try {
      await inviteMember(org!.id, email)
      setInviteMsg({ ok: true, text: `Приглашение отправлено на ${email}` })
      setInviteEmail('')
    } catch (err) {
      setInviteMsg({ ok: false, text: err instanceof Error ? err.message : 'Не удалось отправить приглашение' })
    } finally {
      setInviteBusy(false)
    }
  }

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal ia-modal--wide" role="dialog" aria-modal="true" aria-label={`Участники — ${org.name}`}>
        <div className="ia-modal__head">
          <span className="ia-modal__title">Участники — {org.name}</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <div className="ia-modal__body">
          {error && <div className="ia-modal-error">{error}</div>}

          {loading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)' }}>Загрузка…</div>
          ) : (
            <>
              {pending.length > 0 && (
                <div className="ia-profile-section">
                  <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Заявки на вступление</div>
                  {pending.map((m) => (
                    <div key={m.membership_id} className="ia-org-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={m.name ?? m.email} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.name ?? m.email}</div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{m.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Check size={14} />}
                          loading={busyId === m.membership_id}
                          onClick={() => handleApprove(m.membership_id)}
                        >
                          Одобрить
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<X size={14} />}
                          disabled={busyId === m.membership_id}
                          onClick={() => handleReject(m.membership_id)}
                        >
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="ia-profile-section">
                <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Участники ({active.length})</div>
                {active.length === 0 ? (
                  <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Пока нет участников</div>
                ) : active.map((m) => (
                  <div key={m.membership_id} className="ia-org-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={m.name ?? m.email} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name ?? m.email}</div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{m.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)' }}>с {formatDate(m.created_at)}</span>
                      {isOwner && m.role !== 'owner' ? (
                        <Select
                          size="sm"
                          value={m.role}
                          options={ROLE_OPTIONS}
                          disabled={busyId === m.membership_id}
                          onChange={(e) => handleRoleChange(m.membership_id, e.target.value as 'admin' | 'member')}
                        />
                      ) : (
                        <Badge tone={ROLE_TONE[m.role]} size="sm">{ROLE_LABEL[m.role]}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {canManage && (
                <div className="ia-profile-section">
                  <div className="ia-eyebrow" style={{ marginBottom: 10 }}>Пригласить участника</div>
                  <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
                    <Input
                      type="email"
                      required
                      placeholder="email@company.ru"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Button type="submit" leftIcon={<Mail size={16} />} loading={inviteBusy}>
                      Пригласить
                    </Button>
                  </form>
                  {inviteMsg && (
                    <div className={`ia-profile-msg ia-profile-msg--${inviteMsg.ok ? 'ok' : 'err'}`} style={{ marginTop: 8 }}>
                      {inviteMsg.text}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
