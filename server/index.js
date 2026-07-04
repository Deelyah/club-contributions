import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import { UPLOADS_DIR } from './paths.js'
import authRoutes from './routes/auth.js'
import membersRoutes from './routes/members.js'
import paymentsRoutes from './routes/payments.js'
import duesRoutes from './routes/dues.js'
import auditRoutes from './routes/audit.js'

const app = express()
const PORT = process.env.PORT || 3001

// Comma-separated list of allowed origins (e.g. your Vercel URL) via CORS_ORIGIN.
// Requests proxied through Vercel rewrites are same-origin and skip CORS entirely.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((o) => o.trim())

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

app.use('/api/auth', authRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/dues', duesRoutes)
app.use('/api/audit', auditRoutes)

initDb()
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
