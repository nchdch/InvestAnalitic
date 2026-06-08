import type { Request, Response } from 'express'
import { pool } from '../db/pool'

export async function getHealth(_req: Request, res: Response) {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() })
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      db: 'unavailable',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
