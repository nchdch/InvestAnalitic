import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { healthRouter } from './routes/health.js'
import { accountRouter } from './routes/accounts.js'
import { positionRouter } from './routes/positions.js'
import { tradeRouter } from './routes/trades.js'
import { paymentRouter } from './routes/payments.js'
import { portfolioRouter } from './routes/portfolio.js'
import { authRouter } from './routes/auth.js'
import { orgRouter } from './routes/orgs.js'
import { securitiesRouter } from './routes/securities.js'
import { cashRouter } from './routes/cash.js'
import { noteRouter } from './routes/notes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/organizations', orgRouter)
  app.use('/api/accounts', accountRouter)
  app.use('/api/positions', positionRouter)
  app.use('/api/trades', tradeRouter)
  app.use('/api/payments', paymentRouter)
  app.use('/api/portfolio', portfolioRouter)
  app.use('/api/securities', securitiesRouter)
  app.use('/api/cash', cashRouter)
  app.use('/api/notes', noteRouter)

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path })
  })

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
  app.use(errorHandler)

  return app
}
