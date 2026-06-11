import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'
import { emailService } from './emailService.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-CHANGE-IN-PRODUCTION'
const ACCESS_EXPIRES = '1h'
const REFRESH_DAYS = 30

export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
}

export interface AuthResult {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

function makeAccessToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES })
}

async function makeRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS)
  await pool.query(
    `INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, 'refresh', $3)`,
    [userId, token, expiresAt],
  )
  return token
}

function rowToUser(row: Record<string, unknown>): AuthUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string | null) ?? null,
    emailVerified: row.email_verified as boolean,
  }
}

export async function register(email: string, password: string, name?: string): Promise<AuthResult> {
  const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (exists.rows.length) throw new Error('Пользователь с этим email уже существует')

  const passwordHash = await bcrypt.hash(password, 12)
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)
     RETURNING id, email, name, email_verified`,
    [email, passwordHash, name ?? null],
  )
  const user = rowToUser(rows[0])
  await sendVerificationEmail(user.id, user.email)
  return { user, accessToken: makeAccessToken(user), refreshToken: await makeRefreshToken(user.id) }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { rows } = await pool.query(
    'SELECT id, email, name, password_hash, email_verified FROM users WHERE email = $1',
    [email],
  )
  if (!rows.length) throw new Error('Неверный email или пароль')

  const row = rows[0] as { password_hash: string | null } & Record<string, unknown>
  if (!row.password_hash) throw new Error('Этот аккаунт создан через Google — войдите через Google')

  const valid = await bcrypt.compare(password, row.password_hash)
  if (!valid) throw new Error('Неверный email или пароль')

  const user = rowToUser(row)
  return { user, accessToken: makeAccessToken(user), refreshToken: await makeRefreshToken(user.id) }
}

export async function verifyEmail(token: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT user_id FROM auth_tokens
     WHERE token = $1 AND type = 'email_verify' AND used_at IS NULL AND expires_at > now()`,
    [token],
  )
  if (!rows.length) throw new Error('Ссылка недействительна или истекла')
  await pool.query('UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1', [rows[0].user_id])
  await pool.query('UPDATE auth_tokens SET used_at = now() WHERE token = $1', [token])
}

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await pool.query(
    `INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, 'email_verify', $3)`,
    [userId, token, expiresAt],
  )
  await emailService.sendVerificationEmail(email, token)
}

export async function refreshTokens(refreshToken: string): Promise<AuthResult> {
  const { rows } = await pool.query(
    `SELECT user_id FROM auth_tokens
     WHERE token = $1 AND type = 'refresh' AND used_at IS NULL AND expires_at > now()`,
    [refreshToken],
  )
  if (!rows.length) throw new Error('Сессия истекла. Войдите снова.')

  await pool.query('UPDATE auth_tokens SET used_at = now() WHERE token = $1', [refreshToken])
  const { rows: userRows } = await pool.query(
    'SELECT id, email, name, email_verified FROM users WHERE id = $1',
    [rows[0].user_id],
  )
  if (!userRows.length) throw new Error('Пользователь не найден')

  const user = rowToUser(userRows[0])
  return { user, accessToken: makeAccessToken(user), refreshToken: await makeRefreshToken(user.id) }
}

export async function forgotPassword(email: string): Promise<void> {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (!rows.length) return
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
  await pool.query(
    `INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, 'password_reset', $3)`,
    [rows[0].id, token, expiresAt],
  )
  await emailService.sendPasswordResetEmail(email, token)
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT user_id FROM auth_tokens
     WHERE token = $1 AND type = 'password_reset' AND used_at IS NULL AND expires_at > now()`,
    [token],
  )
  if (!rows.length) throw new Error('Ссылка недействительна или истекла')
  const hash = await bcrypt.hash(newPassword, 12)
  await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hash, rows[0].user_id])
  await pool.query('UPDATE auth_tokens SET used_at = now() WHERE token = $1', [token])
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId])
  if (!rows.length) throw new Error('Пользователь не найден')

  const row = rows[0] as { password_hash: string | null }
  if (!row.password_hash) throw new Error('Этот аккаунт использует вход через Google — пароль не задан')

  const valid = await bcrypt.compare(currentPassword, row.password_hash)
  if (!valid) throw new Error('Неверный текущий пароль')

  const hash = await bcrypt.hash(newPassword, 12)
  await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hash, userId])
}

export function verifyAccessToken(token: string): { sub: string; email: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string; email: string }
}

export async function findOrCreateGoogleUser(googleId: string, email: string, name: string): Promise<AuthResult> {
  let { rows } = await pool.query(
    'SELECT id, email, name, email_verified FROM users WHERE google_id = $1',
    [googleId],
  )

  if (!rows.length) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length) {
      await pool.query(
        'UPDATE users SET google_id = $1, email_verified = true, updated_at = now() WHERE email = $2',
        [googleId, email],
      )
      const updated = await pool.query(
        'SELECT id, email, name, email_verified FROM users WHERE email = $1',
        [email],
      )
      rows = updated.rows
    } else {
      const created = await pool.query(
        `INSERT INTO users (email, name, google_id, email_verified) VALUES ($1, $2, $3, true)
         RETURNING id, email, name, email_verified`,
        [email, name, googleId],
      )
      rows = created.rows
    }
  }

  const user = rowToUser(rows[0])
  return { user, accessToken: makeAccessToken(user), refreshToken: await makeRefreshToken(user.id) }
}
