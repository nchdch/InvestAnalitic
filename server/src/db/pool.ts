import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set — copy .env.example to .env and configure it')
}

export const pool = new Pool({ connectionString })
