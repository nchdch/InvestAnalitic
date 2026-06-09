import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { healthRouter } from './routes/health.js'
import { accountRouter } from './routes/accounts.js'
import { positionRouter } from './routes/positions.js'
import { tradeRouter } from './routes/trades.js'
import { paymentRouter } from './routes/payments.js'
import { portfolioRouter } from './routes/portfolio.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/accounts', accountRouter)
  app.use('/api/positions', positionRouter)
  app.use('/api/trades', tradeRouter)
  app.use('/api/payments', paymentRouter)
  app.use('/api/portfolio', portfolioRouter)

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
