import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import * as orgService from '../services/orgService.js'

export async function lookupInn(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { inn } = req.query as { inn?: string }
    if (!inn) { res.status(400).json({ error: 'inn обязателен' }); return }
    const info = await orgService.lookupOrgByInn(inn)
    if (!info) { res.status(404).json({ error: 'Организация не найдена' }); return }
    res.json(info)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Ошибка поиска' })
  }
}

export async function createOrJoin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { inn } = req.body as { inn?: string }
    if (!inn) { res.status(400).json({ error: 'inn обязателен' }); return }
    const result = await orgService.createOrJoinOrg(req.userId!, inn)
    const status = result.isNew ? 201 : 200
    res.status(status).json(result)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function listUserOrgs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orgs = await orgService.getUserOrgs(req.userId!)
    res.json(orgs)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function getOrg(req: AuthRequest, res: Response): Promise<void> {
  try {
    const org = await orgService.getOrgById(req.params.id, req.userId!)
    if (!org) { res.status(404).json({ error: 'Не найдено' }); return }
    res.json(org)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function listMembers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const members = await orgService.getOrgMembers(req.params.id, req.userId!)
    res.json(members)
  } catch (err) {
    res.status(403).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function approveMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    await orgService.approveMembership(req.params.id, req.params.membershipId, req.userId!)
    res.json({ ok: true })
  } catch (err) {
    res.status(403).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function rejectMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    await orgService.rejectMembership(req.params.id, req.params.membershipId, req.userId!)
    res.json({ ok: true })
  } catch (err) {
    res.status(403).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function updateRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { role } = req.body as { role?: 'admin' | 'member' }
    if (!role || !['admin', 'member'].includes(role)) {
      res.status(400).json({ error: 'role должен быть admin или member' }); return
    }
    await orgService.updateMemberRole(req.params.id, req.params.membershipId, role, req.userId!)
    res.json({ ok: true })
  } catch (err) {
    res.status(403).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function invite(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string }
    if (!email) { res.status(400).json({ error: 'email обязателен' }); return }
    await orgService.inviteMember(req.params.id, email.toLowerCase(), req.userId!)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}

export async function acceptInvite(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { token } = req.body as { token?: string }
    if (!token) { res.status(400).json({ error: 'token обязателен' }); return }
    const org = await orgService.acceptInvite(token, req.userId!)
    res.json(org)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Ошибка' })
  }
}
