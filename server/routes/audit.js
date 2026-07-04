import { Router } from 'express'
import { getDb } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAdmin, (req, res) => {
  const db = getDb()
  const { member_id, limit = 100 } = req.query
  let sql = `
    SELECT a.*, u.username AS admin_username, m.username AS member_username
    FROM audit_logs a
    LEFT JOIN users u ON a.admin_id = u.id
    LEFT JOIN users m ON a.target_member_id = m.id
  `
  const params = []
  if (member_id) {
    sql += ' WHERE a.target_member_id = ?'
    params.push(member_id)
  }
  sql += ` ORDER BY a.created_at DESC LIMIT ${Math.min(parseInt(limit) || 100, 500)}`
  res.json(db.prepare(sql).all(...params))
})

export default router
