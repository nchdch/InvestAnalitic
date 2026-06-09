import type { Request, Response } from 'express'
import * as authService from '../services/authService.js'
import { pool } from '../db/pool.js'

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production',
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, COOKIE_OPTS)
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string }
    if (!email || !password) { res.status(400).json({ error: 'email и password обязательны' }); return }
    if (password.length < 8) { res.status(400).json({ error: 'Пароль должен быть не менее 8 символов' }); return }

    const result = await authService.register(email.toLowerCase().trim(), password, name?.trim())
    setRefreshCookie(res, result.refreshToken)
    res.status(201).json({ user: result.user, accessToken: result.accessToken })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Ошибка регистрации' })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) { res.status(400).json({ error: 'email и password обязательны' }); return }

    const result = await authService.login(email.toLowerCase().trim(), password)
    setRefreshCookie(res, result.refreshToken)
    res.json({ user: result.user, accessToken: result.accessToken })
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Ошибка входа' })
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('refreshToken')
  res.status(204).end()
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = (req.cookies as Record<string, string>).refreshToken
    if (!token) { res.status(401).json({ error: 'Нет refresh token' }); return }

    const result = await authService.refreshTokens(token)
    setRefreshCookie(res, result.refreshToken)
    res.json({ user: result.user, accessToken: result.accessToken })
  } catch (err) {
    res.clearCookie('refreshToken')
    res.status(401).json({ error: err instanceof Error ? err.message : 'Ошибка обновления токена' })
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.query as { token?: string }
    if (!token) { res.status(400).json({ error: 'token обязателен' }); return }
    await authService.verifyEmail(token)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Ошибка верификации' })
  }
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string }
    if (!email) { res.status(400).json({ error: 'email обязателен' }); return }
    // Find user and resend — silently succeed even if email not found
    const { rows } = await pool.query('SELECT id, email_verified FROM users WHERE email = $1', [email.toLowerCase()])
    if (rows.length && !(rows[0].email_verified as boolean)) {
      await authService.sendVerificationEmail(rows[0].id as string, email.toLowerCase())
    }
    res.json({ ok: true })
  } catch {
    res.json({ ok: true })
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string }
    if (!email) { res.status(400).json({ error: 'email обязателен' }); return }
    await authService.forgotPassword(email.toLowerCase().trim())
    res.json({ ok: true })
  } catch {
    res.json({ ok: true })
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string; password?: string }
    if (!token || !password) { res.status(400).json({ error: 'token и password обязательны' }); return }
    if (password.length < 8) { res.status(400).json({ error: 'Пароль должен быть не менее 8 символов' }); return }
    await authService.resetPassword(token, password)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Ошибка сброса пароля' })
  }
}

// Google OAuth — redirect flow
export function googleRedirect(_req: Request, res: Response): void {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) { res.status(501).json({ error: 'Google OAuth не настроен' }); return }

  const redirectUri = encodeURIComponent(
    `${process.env.API_URL ?? 'http://localhost:4000'}/api/auth/google/callback`,
  )
  const scope = encodeURIComponent('openid email profile')
  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`,
  )
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  try {
    const { code } = req.query as { code?: string }
    if (!code) throw new Error('Нет кода авторизации')

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = `${process.env.API_URL ?? 'http://localhost:4000'}/api/auth/google/callback`

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const tokenData = await tokenRes.json() as { id_token?: string; error?: string }
    if (!tokenData.id_token) throw new Error('Не удалось получить токен Google')

    // Decode id_token payload (no verification needed — we just got it from Google)
    const b64 = tokenData.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString()) as {
      sub: string; email: string; name: string
    }

    const result = await authService.findOrCreateGoogleUser(payload.sub, payload.email, payload.name)
    setRefreshCookie(res, result.refreshToken)
    res.redirect(`${FRONTEND}/auth/callback#token=${result.accessToken}`)
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'Ошибка Google OAuth')
    res.redirect(`${FRONTEND}/auth?error=${msg}`)
  }
}
