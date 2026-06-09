import type { OrgInfo, Organization, OrgMember } from '@/types'
import { useAuthStore } from '@/store/authStore'

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken  // getState() is fine outside React components
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/organizations${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Org API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function lookupInn(inn: string): Promise<OrgInfo> {
  return request(`/lookup?inn=${encodeURIComponent(inn)}`)
}

export function listOrgs(): Promise<Organization[]> {
  return request('/')
}

export function createOrJoinOrg(inn: string): Promise<{ org: Organization; membership: object; isNew: boolean }> {
  return request('/', { method: 'POST', body: JSON.stringify({ inn }) })
}

export function getOrg(id: string): Promise<Organization> {
  return request(`/${id}`)
}

export function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  return request(`/${orgId}/members`)
}

export function inviteMember(orgId: string, email: string): Promise<{ ok: boolean }> {
  return request(`/${orgId}/invite`, { method: 'POST', body: JSON.stringify({ email }) })
}

export function approveMember(orgId: string, membershipId: string): Promise<{ ok: boolean }> {
  return request(`/${orgId}/members/${membershipId}/approve`, { method: 'POST' })
}

export function rejectMember(orgId: string, membershipId: string): Promise<{ ok: boolean }> {
  return request(`/${orgId}/members/${membershipId}/reject`, { method: 'POST' })
}

export function updateMemberRole(orgId: string, membershipId: string, role: 'admin' | 'member'): Promise<{ ok: boolean }> {
  return request(`/${orgId}/members/${membershipId}/role`, { method: 'PUT', body: JSON.stringify({ role }) })
}

export function acceptInvite(token: string): Promise<Organization> {
  return request('/invite/accept', { method: 'POST', body: JSON.stringify({ token }) })
}
