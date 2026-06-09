import { pool } from '../db/pool.js'
import { lookupByInn } from './innService.js'
import { emailService } from './emailService.js'
import type { OrgInfo } from './innService.js'

export { lookupByInn as lookupOrgByInn }

export interface OrgRow {
  id: string
  inn: string
  name: string
  full_name: string | null
  ogrn: string | null
  kpp: string | null
  address: string | null
  created_at: string
}

export interface MembershipRow {
  id: string
  user_id: string
  org_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'active' | 'rejected'
  invited_by: string | null
  created_at: string
}

export async function createOrJoinOrg(
  userId: string,
  inn: string,
): Promise<{ org: OrgRow; membership: MembershipRow; isNew: boolean }> {
  const info: OrgInfo | null = await lookupByInn(inn)
  if (!info) throw new Error('Организация с таким ИНН не найдена')

  let { rows: orgRows } = await pool.query('SELECT * FROM organizations WHERE inn = $1', [inn])
  let isNew = false

  if (!orgRows.length) {
    const created = await pool.query(
      `INSERT INTO organizations (inn, name, full_name, ogrn, kpp, address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [info.inn, info.name, info.fullName, info.ogrn, info.kpp, info.address],
    )
    orgRows = created.rows
    isNew = true
  }

  const org = orgRows[0] as OrgRow

  const { rows: existing } = await pool.query(
    'SELECT * FROM org_memberships WHERE user_id = $1 AND org_id = $2',
    [userId, org.id],
  )
  if (existing.length) return { org, membership: existing[0] as MembershipRow, isNew: false }

  const role = isNew ? 'owner' : 'member'
  const status = isNew ? 'active' : 'pending'
  const { rows: memberRows } = await pool.query(
    `INSERT INTO org_memberships (user_id, org_id, role, status) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, org.id, role, status],
  )

  if (!isNew) {
    const { rows: userRows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId])
    const { rows: admins } = await pool.query(
      `SELECT u.email FROM users u
       JOIN org_memberships m ON m.user_id = u.id
       WHERE m.org_id = $1 AND m.role IN ('owner','admin') AND m.status = 'active'`,
      [org.id],
    )
    const requesterName = (userRows[0]?.name as string | null) ?? 'Пользователь'
    for (const a of admins) {
      await emailService.sendOrgJoinRequestEmail(a.email as string, requesterName, org.name)
    }
  }

  return { org, membership: memberRows[0] as MembershipRow, isNew }
}

export async function getUserOrgs(userId: string): Promise<Array<OrgRow & { role: string; status: string }>> {
  const { rows } = await pool.query(
    `SELECT o.*, m.role, m.status
     FROM organizations o
     JOIN org_memberships m ON m.org_id = o.id
     WHERE m.user_id = $1
     ORDER BY o.name`,
    [userId],
  )
  return rows as Array<OrgRow & { role: string; status: string }>
}

export async function getOrgById(orgId: string, userId: string): Promise<OrgRow | null> {
  const { rows: check } = await pool.query(
    `SELECT id FROM org_memberships WHERE org_id = $1 AND user_id = $2 AND status = 'active'`,
    [orgId, userId],
  )
  if (!check.length) return null
  const { rows } = await pool.query('SELECT * FROM organizations WHERE id = $1', [orgId])
  return (rows[0] as OrgRow) ?? null
}

export async function getOrgMembers(orgId: string, requesterId: string) {
  const { rows: check } = await pool.query(
    `SELECT id FROM org_memberships WHERE org_id = $1 AND user_id = $2 AND status = 'active'`,
    [orgId, requesterId],
  )
  if (!check.length) throw new Error('Нет доступа к организации')
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name, m.id as membership_id, m.role, m.status, m.created_at
     FROM users u
     JOIN org_memberships m ON m.user_id = u.id
     WHERE m.org_id = $1
     ORDER BY m.created_at`,
    [orgId],
  )
  return rows
}

export async function approveMembership(orgId: string, membershipId: string, approverId: string): Promise<void> {
  const { rows: check } = await pool.query(
    `SELECT id FROM org_memberships WHERE org_id = $1 AND user_id = $2 AND role IN ('owner','admin') AND status = 'active'`,
    [orgId, approverId],
  )
  if (!check.length) throw new Error('Нет прав для управления заявками')
  await pool.query(
    `UPDATE org_memberships SET status = 'active' WHERE id = $1 AND org_id = $2`,
    [membershipId, orgId],
  )
}

export async function rejectMembership(orgId: string, membershipId: string, approverId: string): Promise<void> {
  const { rows: check } = await pool.query(
    `SELECT id FROM org_memberships WHERE org_id = $1 AND user_id = $2 AND role IN ('owner','admin') AND status = 'active'`,
    [orgId, approverId],
  )
  if (!check.length) throw new Error('Нет прав')
  await pool.query(
    `UPDATE org_memberships SET status = 'rejected' WHERE id = $1 AND org_id = $2`,
    [membershipId, orgId],
  )
}

export async function updateMemberRole(
  orgId: string,
  membershipId: string,
  newRole: 'admin' | 'member',
  requesterId: string,
): Promise<void> {
  const { rows: check } = await pool.query(
    `SELECT id FROM org_memberships WHERE org_id = $1 AND user_id = $2 AND role = 'owner' AND status = 'active'`,
    [orgId, requesterId],
  )
  if (!check.length) throw new Error('Только владелец может изменять роли')
  await pool.query(
    `UPDATE org_memberships SET role = $1 WHERE id = $2 AND org_id = $3`,
    [newRole, membershipId, orgId],
  )
}

export async function inviteMember(orgId: string, email: string, inviterId: string): Promise<void> {
  const { rows: check } = await pool.query(
    `SELECT id FROM org_memberships WHERE org_id = $1 AND user_id = $2 AND role IN ('owner','admin') AND status = 'active'`,
    [orgId, inviterId],
  )
  if (!check.length) throw new Error('Нет прав для приглашения участников')

  const { rows: orgRows } = await pool.query('SELECT name FROM organizations WHERE id = $1', [orgId])
  const { rows: inviterRows } = await pool.query('SELECT name FROM users WHERE id = $1', [inviterId])
  if (!orgRows.length) throw new Error('Организация не найдена')

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await pool.query(
    `INSERT INTO org_invites (org_id, email, token, invited_by, expires_at) VALUES ($1, $2, $3, $4, $5)`,
    [orgId, email, token, inviterId, expiresAt],
  )

  const inviterName = (inviterRows[0]?.name as string | null) ?? 'Администратор'
  await emailService.sendOrgInviteEmail(email, inviterName, orgRows[0].name as string, token)
}

export async function acceptInvite(token: string, userId: string): Promise<OrgRow> {
  const { rows } = await pool.query(
    `SELECT * FROM org_invites WHERE token = $1 AND used_at IS NULL AND expires_at > now()`,
    [token],
  )
  if (!rows.length) throw new Error('Приглашение недействительно или истекло')

  const invite = rows[0] as { org_id: string; email: string; id: string }
  const { rows: userRows } = await pool.query('SELECT email FROM users WHERE id = $1', [userId])
  if (userRows[0]?.email !== invite.email) throw new Error('Приглашение предназначено для другого email')

  const existing = await pool.query(
    'SELECT id FROM org_memberships WHERE user_id = $1 AND org_id = $2',
    [userId, invite.org_id],
  )
  if (!existing.rows.length) {
    await pool.query(
      `INSERT INTO org_memberships (user_id, org_id, role, status) VALUES ($1, $2, 'member', 'active')`,
      [userId, invite.org_id],
    )
  } else {
    await pool.query(
      `UPDATE org_memberships SET status = 'active' WHERE user_id = $1 AND org_id = $2`,
      [userId, invite.org_id],
    )
  }
  await pool.query('UPDATE org_invites SET used_at = now() WHERE id = $1', [invite.id])

  const { rows: orgRows } = await pool.query('SELECT * FROM organizations WHERE id = $1', [invite.org_id])
  return orgRows[0] as OrgRow
}
