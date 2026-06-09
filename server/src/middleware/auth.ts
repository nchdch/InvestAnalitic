import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/authService.js'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Необходима авторизация' })
    return
  }
  try {
    const payload = verifyAccessToken(header.slice(7))
    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    res.status(401).json({ error: 'Токен недействителен или истёк' })
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice(7))
      req.userId = payload.sub
      req.userEmail = payload.email
    } catch {
      // ignore
    }
  }
  next()
}
