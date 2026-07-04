import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'
import { RECEIPTS_DIR } from '../paths.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const receiptStorage = multer.diskStorage({
  destination: RECEIPTS_DIR,
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
})
const upload = multer({ storage: receiptStorage, limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

// Member: get own payment history
router.get('/my', requireAuth, (req, res) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT p.*, u.username AS created_by_username
    FROM payments p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.member_id = ?
    ORDER BY p.payment_date DESC
  `).all(req.user.id)
  res.json(rows)
})

// Admin: get payment history for a specific member
router.get('/member/:memberId', requireAdmin, (req, res) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT p.*, u.username AS created_by_username
    FROM payments p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.member_id = ?
    ORDER BY p.payment_date DESC
  `).all(req.params.memberId)
  res.json(rows)
})

// Admin: add a payment record
router.post('/', requireAdmin, upload.single('receipt'), (req, res) => {
  const { member_id, period_label, payment_date, due_amount, amount_paid, notes } = req.body
  if (!member_id || !period_label || !payment_date || !due_amount) {
    return res.status(400).json({ error: 'member_id, period_label, payment_date, and due_amount are required' })
  }
  const db = getDb()
  const id = uuidv4()
  const receipt_path = req.file ? `/uploads/receipts/${req.file.filename}` : null
  db.prepare(`
    INSERT INTO payments (id, member_id, period_label, payment_date, due_amount, amount_paid, receipt_path, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, member_id, period_label, payment_date,
    parseFloat(due_amount), parseFloat(amount_paid) || 0,
    receipt_path, notes || null, req.user.id
  )
  db.prepare(
    'INSERT INTO audit_logs (admin_id, action, target_member_id, details) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, 'ADD_PAYMENT', member_id, JSON.stringify({ period_label, amount_paid, payment_date }))

  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(id))
})

// Admin: update a payment record
router.put('/:id', requireAdmin, upload.single('receipt'), (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Payment not found' })

  const { period_label, payment_date, due_amount, amount_paid, notes } = req.body
  const receipt_path = req.file ? `/uploads/receipts/${req.file.filename}` : existing.receipt_path

  db.prepare(`
    UPDATE payments SET
      period_label = ?, payment_date = ?, due_amount = ?, amount_paid = ?,
      receipt_path = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    period_label ?? existing.period_label,
    payment_date ?? existing.payment_date,
    due_amount != null ? parseFloat(due_amount) : existing.due_amount,
    amount_paid != null ? parseFloat(amount_paid) : existing.amount_paid,
    receipt_path,
    notes !== undefined ? notes : existing.notes,
    req.params.id
  )
  db.prepare(
    'INSERT INTO audit_logs (admin_id, action, target_member_id, details) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, 'UPDATE_PAYMENT', existing.member_id, JSON.stringify({ payment_id: req.params.id, amount_paid, period_label }))

  res.json(db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id))
})

export default router
