import type { AuthUser } from '@/types'
import { useAuthStore } from '@/store/authStore'

interface AuthResponse {
  user: AuthUser
  accessToken: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/auth${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Auth error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function registerUser(email: string, password: string, name?: string): Promise<AuthResponse> {
  return request('/register', { method: 'POST', body: JSON.stringify({ email, password, name }) })
}

export function loginUser(email: string, password: string): Promise<AuthResponse> {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function logoutUser(): Promise<void> {
  return request('/logout', { method: 'POST' })
}

export function refreshSession(): Promise<AuthResponse> {
  return request('/refresh', { method: 'POST' })
}

export function verifyEmail(token: string): Promise<{ ok: boolean }> {
  return request(`/verify-email?token=${encodeURIComponent(token)}`)
}

export function resendVerification(email: string): Promise<{ ok: boolean }> {
  return request('/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })
}

export function forgotPassword(email: string): Promise<{ ok: boolean }> {
  return request('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
}

export function resetPassword(token: string, password: string): Promise<{ ok: boolean }> {
  return request('/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
}

export function getGoogleOAuthUrl(): string {
  return '/api/auth/google'
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Auth error ${res.status}`)
  }
  return res.json() as Promise<{ ok: boolean }>
}
