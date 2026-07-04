import { Router } from 'express'
import { getDb } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, (req, res) => {
  const db = getDb()
  const config = db.prepare('SELECT * FROM dues_config ORDER BY id DESC LIMIT 1').get()
  res.json(config ?? null)
})

router.post('/', requireAdmin, (req, res) => {
  const { amount, frequency, start_date } = req.body
  if (!amount || !frequency || !start_date) {
    return res.status(400).json({ error: 'amount, frequency, and start_date are required' })
  }
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO dues_config (amount, frequency, start_date, created_by) VALUES (?, ?, ?, ?)'
  ).run(parseFloat(amount), frequency, start_date, req.user.id)

  db.prepare(
    'INSERT INTO audit_logs (admin_id, action, details) VALUES (?, ?, ?)'
  ).run(req.user.id, 'UPDATE_DUES_CONFIG', JSON.stringify({ amount, frequency, start_date }))

  res.status(201).json(db.prepare('SELECT * FROM dues_config WHERE id = ?').get(result.lastInsertRowid))
})

export default router
